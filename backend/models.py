# Defines the Database Models

from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4
from datetime import datetime

db = SQLAlchemy()

def get_uuid():
    return uuid4().hex

class User(db.Model):
    __tablename__ = "users"
    id         = db.Column(db.String(32), primary_key=True, default=get_uuid)
    first_name = db.Column(db.String(50))
    last_name  = db.Column(db.String(50))
    email      = db.Column(db.String(50), unique=True, nullable=False)
    password   = db.Column(db.Text)
    google_user= db.Column(db.Boolean, default=False)
    # Relationships
    notes      = db.relationship("Note",     backref="user", lazy=True, cascade="all, delete-orphan")
    bookmarks  = db.relationship("Bookmark", backref="user", lazy=True, cascade="all, delete-orphan")


class Note(db.Model):
    __tablename__ = "notes"
    id          = db.Column(db.String(32), primary_key=True, default=get_uuid)
    user_id     = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    title       = db.Column(db.String(200), default="")
    description = db.Column(db.Text, default="")
    category    = db.Column(db.String(50), default="Home")
    completed   = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "category":    self.category,
            "completed":   self.completed,
            "createdAt":   self.created_at.isoformat() if self.created_at else None,
            "updatedAt":   self.updated_at.isoformat() if self.updated_at else None,
        }


class Bookmark(db.Model):
    __tablename__ = "bookmarks"
    id         = db.Column(db.String(32), primary_key=True, default=get_uuid)
    user_id    = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    url        = db.Column(db.Text, nullable=False)
    title      = db.Column(db.Text, default="")
    image      = db.Column(db.Text, default="")
    source     = db.Column(db.String(100), default="")
    saved_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":      self.id,
            "url":     self.url,
            "title":   self.title,
            "image":   self.image,
            "source":  self.source,
            "savedAt": self.saved_at.isoformat() if self.saved_at else None,
        }
