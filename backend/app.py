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
from models import db, User
from dotenv import load_dotenv
import os
import secrets

load_dotenv()
app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///flaskdb.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True

# Flask-Mail config (uses Gmail SMTP — set credentials in .env)
app.config["MAIL_SERVER"]   = "smtp.gmail.com"
app.config["MAIL_PORT"]     = 587
app.config["MAIL_USE_TLS"]  = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

jwt   = JWTManager(app)
bcrypt = Bcrypt(app)
mail  = Mail(app)
CORS(app, supports_credentials=True)
db.init_app(app)

# In-memory store for reset tokens  {token: email}
# For production use Redis or a DB table instead
reset_tokens = {}

# Create database tables
with app.app_context():
    db.create_all()


@app.route("/")
def hello_world():
    return "Hey Hii..!!"


# Protected Route - Accessed with valid JWT token
@app.route("/profile")
@jwt_required()
def profile():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    return jsonify({
        "id": user.id,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "googleUser": user.google_user
    })


# Sign-up Route
@app.route("/signup", methods=["POST"])
def signup():
    first_name = request.json.get("firstName")
    last_name = request.json.get("lastName")
    email = request.json["email"]
    password = request.json["password"]

    user_exists = User.query.filter_by(email=email).first() is not None

    if user_exists:
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")    
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=hashed_password,
        google_user=False
    )
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=new_user.id)

    return jsonify(
        {"access_token": access_token, "id": new_user.id, "email": new_user.email, "firstName": new_user.first_name}
    )


# Login Route
@app.route("/login", methods=["POST"])
def login_user():
    email = request.json["email"]
    password = request.json["password"]

    user = User.query.filter_by(email=email).first()

    if user is None:
        return jsonify({"error": "Unauthorized Access"}), 401

    if user.google_user:
        return jsonify({
            "error":"Please login using Google."
    }),401

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Unauthorized"}), 401

    access_token = create_access_token(identity=user.id)

    return jsonify({"access_token": access_token, "id": user.id, "email": user.email, "firstName": user.first_name})


# Google login Route
@app.route("/google-login", methods=["POST"])
def google_login():
    # The frontend sends the Google credential (ID token) in the request body
    credential = request.json.get("credential")
    if not credential:
        return jsonify({"error": "Missing credential"}), 400

    try:
        # Verify the token with Google's servers
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        # Token is invalid or expired
        print(f"Google token verification failed: {e}")
        return jsonify({"error": "Invalid Google token", "detail": str(e)}), 401

    email      = id_info.get("email")
    first_name = id_info.get("given_name", "")
    last_name  = id_info.get("family_name", "")

    if not email:
        return jsonify({"error": "Email not provided by Google"}), 400

    # Look up existing user or create a new one
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=None,   # Google users have no password
            google_user=True
        )
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=user.id)

    return jsonify({
        "access_token": access_token,
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name
    })



# Forgot Password — sends a reset code to the user's email
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    email = request.json.get("email", "").strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    # Always return 200 to avoid leaking which emails exist
    if user is None or user.google_user:
        return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

    # Generate a short 6-digit OTP code
    code = str(secrets.randbelow(900000) + 100000)
    reset_tokens[code] = email

    try:
        msg = Message(
            subject="News Blog Website — Password Reset Code",
            recipients=[email],
            body=(
                f"Hi {user.first_name},\n\n"
                f"Your password reset code is: {code}\n\n"
                f"This code is valid for 15 minutes. If you didn't request this, ignore this email.\n\n"
                f"— Zap Blog Team"
            ),
        )
        mail.send(msg)
    except Exception as e:
        print(f"Mail error: {e}")
        return jsonify({"error": "Failed to send email. Check server mail config."}), 500

    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200


# Reset Password — verifies the code and sets a new password
@app.route("/reset-password", methods=["POST"])
def reset_password():
    code     = request.json.get("code", "").strip()
    new_pass = request.json.get("password", "").strip()

    if not code or not new_pass:
        return jsonify({"error": "Code and new password are required"}), 400

    email = reset_tokens.get(code)
    if not email:
        return jsonify({"error": "Invalid or expired reset code"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.password = bcrypt.generate_password_hash(new_pass).decode("utf-8")
    db.session.commit()
    del reset_tokens[code]  # one-time use

    return jsonify({"message": "Password reset successful"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
