# Full-Stack News & Productivity Platform

A web application where users can read live news with AI-generated summaries, check real-time weather, and manage personal notes and bookmarks — secured with JWT authentication and Google OAuth 2.0.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Axios, React Router DOM, Context API |
| Backend | Python Flask, Flask-JWT-Extended, Flask-Bcrypt, Flask-Mail, Flask-Limiter |
| Database | SQLite via SQLAlchemy ORM |
| Auth | JWT, Google OAuth 2.0, Bcrypt |
| APIs | NewsAPI, OpenWeatherMap, Google Gemini |

---

## Features

- Live news feed with AI-generated summaries (Google Gemini)
- Real-time weather with animated backgrounds
- CRUD operations on personal notes and bookmarks
- JWT auth + Google OAuth 2.0 social login
- OTP-based password reset via email (15-minute expiry)
- Rate-limited login endpoints, voice AI assistant
- Dark mode, infinite scroll, voice search

---

## Setup & Run

### Prerequisites
- Python 3.8+, Node.js 16+, Git

### 1. Clone
```bash
git clone https://github.com/Revathi-15/News-Website.git
cd News-Website
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install flask flask-jwt-extended flask-bcrypt flask-cors flask-mail flask-limiter flask-sqlalchemy python-dotenv google-auth redis
```

Create `backend/.env`:
```
JWT_SECRET_KEY=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
MAIL_USERNAME=youremail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
```

```bash
python app.py                # runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm start                    # runs on http://localhost:3000
```

> Keep both terminals running simultaneously.

### Demo
https://github.com/user-attachments/assets/050720ff-fd7e-4478-bb9c-abf19dcb36b5

