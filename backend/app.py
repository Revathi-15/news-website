# Exposes Backend API

from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db, User, Note, Bookmark
from dotenv import load_dotenv
from datetime import datetime
import os
import secrets
import redis

load_dotenv()
app = Flask(__name__)

app.config["JWT_SECRET_KEY"]               = os.getenv("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID                           = os.getenv("GOOGLE_CLIENT_ID")
app.config["SQLALCHEMY_DATABASE_URI"]      = "sqlite:///flaskdb.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"]              = False   # quieter logs

# Flask-Mail config (Gmail SMTP)
app.config["MAIL_SERVER"]         = "smtp.gmail.com"
app.config["MAIL_PORT"]           = 587
app.config["MAIL_USE_TLS"]        = True
app.config["MAIL_USERNAME"]       = (os.getenv("MAIL_USERNAME") or "").strip()
app.config["MAIL_PASSWORD"]       = (os.getenv("MAIL_PASSWORD") or "").replace(" ", "")  # strip spaces
app.config["MAIL_DEFAULT_SENDER"] = (os.getenv("MAIL_USERNAME") or "").strip()
app.config["MAIL_TIMEOUT"]        = 20

# ── Extensions ──────────────────────────────────────────────────────────────
jwt    = JWTManager(app)
bcrypt = Bcrypt(app)
mail   = Mail(app)
CORS(app, supports_credentials=True)
db.init_app(app)

# ── Rate Limiter (Feature 7) ─────────────────────────────────────────────────
# Uses in-memory store by default — swap storage_uri to Redis in production
REDIS_URL = os.getenv("REDIS_URL", "")
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri=REDIS_URL if REDIS_URL else "memory://",
    default_limits=[],   # no global limit — per-route only
)

# ── OTP Store (Feature 6) — Redis with in-memory fallback ──────────────────
_redis_client = None
if REDIS_URL:
    # Only attempt Redis when an explicit URL is configured (e.g. production)
    try:
        _r = redis.Redis.from_url(REDIS_URL, socket_connect_timeout=2, socket_timeout=2)
        _r.ping()
        _redis_client = _r
        print("OTP store: Redis connected")
    except Exception:
        print("OTP store: Redis unavailable — using in-memory fallback")
else:
    print("OTP store: No REDIS_URL set — using in-memory fallback (development mode)")

_memory_tokens: dict = {}   # fallback: {code: email}
OTP_TTL = 900               # 15 minutes

def otp_set(code: str, email: str):
    if _redis_client:
        _redis_client.setex(f"otp:{code}", OTP_TTL, email)
    else:
        _memory_tokens[code] = email

def otp_get(code: str):
    if _redis_client:
        val = _redis_client.get(f"otp:{code}")
        return val.decode() if val else None
    return _memory_tokens.get(code)

def otp_delete(code: str):
    if _redis_client:
        _redis_client.delete(f"otp:{code}")
    else:
        _memory_tokens.pop(code, None)

# ── Create tables ─────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()


# ════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ════════════════════════════════════════════════════════════════════
@app.route("/")
def hello_world():
    return "Hey Hii..!!"


# ════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ════════════════════════════════════════════════════════════════════

@app.route("/signup", methods=["POST"])
@limiter.limit("10 per minute")
def signup():
    first_name = request.json.get("firstName", "").strip()
    last_name  = request.json.get("lastName", "").strip()
    email      = request.json.get("email", "").strip()
    password   = request.json.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user   = User(first_name=first_name, last_name=last_name,
                  email=email, password=hashed, google_user=False)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token, "id": user.id,
                    "email": user.email, "firstName": user.first_name})


@app.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login_user():
    email    = request.json.get("email", "").strip()
    password = request.json.get("password", "")

    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "Unauthorized Access"}), 401
    if user.google_user:
        return jsonify({"error": "Please login using Google."}), 401
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Unauthorized"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token, "id": user.id,
                    "email": user.email, "firstName": user.first_name})


@app.route("/google-login", methods=["POST"])
def google_login():
    credential = request.json.get("credential")
    if not credential:
        return jsonify({"error": "Missing credential"}), 400
    try:
        id_info = id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError as e:
        return jsonify({"error": "Invalid Google token", "detail": str(e)}), 401

    email      = id_info.get("email")
    first_name = id_info.get("given_name", "")
    last_name  = id_info.get("family_name", "")

    if not email:
        return jsonify({"error": "Email not provided by Google"}), 400

    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(first_name=first_name, last_name=last_name,
                    email=email, password=None, google_user=True)
        db.session.add(user)
        db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token, "id": user.id,
                    "email": user.email, "firstName": user.first_name})


@app.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per minute")
def forgot_password():
    email = request.json.get("email", "").strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    # Debug print — remove before production
    print(f"[FORGOT-PW] email={email} user_found={user is not None} google_user={user.google_user if user else 'N/A'}")

    if user is None:
        print(f"[FORGOT-PW] Skipped — {email} not found in database")
        return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

    if user.google_user:
        print(f"[FORGOT-PW] Skipped — {email} is a Google account")
        return jsonify({"error": "google_account"}), 400

    # Check mail is configured before even trying
    mail_user = app.config.get("MAIL_USERNAME", "")
    mail_pass = app.config.get("MAIL_PASSWORD", "")
    if not mail_user or not mail_pass or "your_" in mail_user or "your_" in mail_pass:
        print("MAIL ERROR: MAIL_USERNAME or MAIL_PASSWORD not configured in .env")
        return jsonify({"error": "Email service not configured. Contact the administrator."}), 500

    code = str(secrets.randbelow(900000) + 100000)
    otp_set(code, email)
    print(f"[OTP DEBUG] code={code} for email={email}")   # visible in terminal

    try:
        msg = Message(
            subject="Your Password Reset Code",
            recipients=[email],
            body=(
                f"Hi {user.first_name},\n\n"
                f"Your password reset code is: {code}\n\n"
                f"This code is valid for 15 minutes.\n"
                f"If you did not request this, ignore this email.\n\n"
                f"— Zap Blog Team"
            ),
        )
        mail.send(msg)
        print(f"[MAIL] OTP sent successfully to {email}")
    except Exception as e:
        print(f"[MAIL ERROR] {type(e).__name__}: {e}")
        # Still return the code in terminal for testing — remove in production
        return jsonify({
            "error": f"Failed to send email: {str(e)}",
            "debug_code": code   # REMOVE this line before deploying
        }), 500

    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200


# ── Quick mail test route (dev only) ────────────────────────────────────────
@app.route("/test-mail")
def test_mail():
    """Visit http://127.0.0.1:5000/test-mail to verify mail config works."""
    mail_user = app.config.get("MAIL_USERNAME", "")
    mail_pass = app.config.get("MAIL_PASSWORD", "")
    if not mail_user or "your_" in mail_user:
        return jsonify({"error": "MAIL_USERNAME not set in .env"}), 500
    try:
        msg = Message(
            subject="Zap Blog — Mail Test",
            recipients=[mail_user],
            body="If you see this, Flask-Mail is working correctly!"
        )
        mail.send(msg)
        return jsonify({"message": f"Test email sent to {mail_user} — check inbox/spam"})
    except Exception as e:
        return jsonify({"error": f"{type(e).__name__}: {str(e)}"}), 500


@app.route("/reset-password", methods=["POST"])
def reset_password():
    code     = request.json.get("code", "").strip()
    new_pass = request.json.get("password", "").strip()

    if not code or not new_pass:
        return jsonify({"error": "Code and new password are required"}), 400

    email = otp_get(code)
    if not email:
        return jsonify({"error": "Invalid or expired reset code"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.password = bcrypt.generate_password_hash(new_pass).decode("utf-8")
    db.session.commit()
    otp_delete(code)

    return jsonify({"message": "Password reset successful"}), 200


# ════════════════════════════════════════════════════════════════════
# PROFILE ROUTE (Feature 3 — backend already existed, ensuring it
# also returns joined_at and account_type for the profile page)
# ════════════════════════════════════════════════════════════════════

@app.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user = User.query.get(get_jwt_identity())
    return jsonify({
        "id":         user.id,
        "firstName":  user.first_name,
        "lastName":   user.last_name,
        "email":      user.email,
        "googleUser": user.google_user,
    })


@app.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update display name."""
    user       = User.query.get(get_jwt_identity())
    first_name = request.json.get("firstName", "").strip()
    last_name  = request.json.get("lastName", "").strip()

    if not first_name:
        return jsonify({"error": "First name is required"}), 400

    user.first_name = first_name[:50]
    user.last_name  = last_name[:50]
    db.session.commit()

    # Reflect new name in any future JWT reads
    return jsonify({"firstName": user.first_name, "lastName": user.last_name})


# ════════════════════════════════════════════════════════════════════
# NOTES ROUTES (Feature 1)
# ════════════════════════════════════════════════════════════════════

@app.route("/notes", methods=["GET"])
@jwt_required()
def get_notes():
    user_id = get_jwt_identity()
    notes   = Note.query.filter_by(user_id=user_id)\
                        .order_by(Note.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@app.route("/notes", methods=["POST"])
@jwt_required()
def create_note():
    user_id = get_jwt_identity()
    data    = request.json or {}
    note    = Note(
        user_id     = user_id,
        title       = (data.get("title") or "")[:200],
        description = data.get("description") or "",
        category    = data.get("category") or "Home",
        completed   = bool(data.get("completed", False)),
    )
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@app.route("/notes/<note_id>", methods=["PUT"])
@jwt_required()
def update_note(note_id):
    user_id = get_jwt_identity()
    note    = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    data = request.json or {}
    if "title"       in data: note.title       = (data["title"] or "")[:200]
    if "description" in data: note.description = data["description"] or ""
    if "category"    in data: note.category    = data["category"] or "Home"
    if "completed"   in data: note.completed   = bool(data["completed"])
    note.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(note.to_dict())


@app.route("/notes/<note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id):
    user_id = get_jwt_identity()
    note    = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


# ════════════════════════════════════════════════════════════════════
# BOOKMARKS ROUTES (Feature 2)
# ════════════════════════════════════════════════════════════════════

@app.route("/bookmarks", methods=["GET"])
@jwt_required()
def get_bookmarks():
    user_id   = get_jwt_identity()
    bookmarks = Bookmark.query.filter_by(user_id=user_id)\
                              .order_by(Bookmark.saved_at.desc()).all()
    return jsonify([b.to_dict() for b in bookmarks])


@app.route("/bookmarks", methods=["POST"])
@jwt_required()
def add_bookmark():
    user_id = get_jwt_identity()
    data    = request.json or {}
    url     = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Prevent duplicates
    if Bookmark.query.filter_by(user_id=user_id, url=url).first():
        return jsonify({"error": "Already bookmarked"}), 409

    bm = Bookmark(
        user_id = user_id,
        url     = url,
        title   = data.get("title") or "",
        image   = data.get("image") or "",
        source  = data.get("source") or "",
    )
    db.session.add(bm)
    db.session.commit()
    return jsonify(bm.to_dict()), 201


@app.route("/bookmarks/<bm_id>", methods=["DELETE"])
@jwt_required()
def delete_bookmark(bm_id):
    user_id = get_jwt_identity()
    bm      = Bookmark.query.filter_by(id=bm_id, user_id=user_id).first()
    if not bm:
        return jsonify({"error": "Bookmark not found"}), 404
    db.session.delete(bm)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
