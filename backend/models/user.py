from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from passlib.hash import pbkdf2_sha256

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    preferred_friend_gender = db.Column(db.String(10), default='neutral')  # 'male', 'female', or 'neutral'
    
    # Relationships
    chats = db.relationship('Chat', backref='user', lazy=True, cascade='all, delete-orphan')
    journals = db.relationship('Journal', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, username, email, password, preferred_friend_gender='neutral'):
        self.username = username
        self.email = email
        self.password_hash = self.hash_password(password)
        self.preferred_friend_gender = preferred_friend_gender
    
    def hash_password(self, password):
        return pbkdf2_sha256.hash(password)
    
    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.password_hash)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'preferred_friend_gender': self.preferred_friend_gender
        }