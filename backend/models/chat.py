from datetime import datetime
from models.user import db

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_from_user = db.Column(db.Boolean, default=True)  # True if message is from user, False if from AI
    
    def __init__(self, user_id, message, response=None, is_from_user=True):
        self.user_id = user_id
        self.message = message
        self.response = response
        self.is_from_user = is_from_user
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'response': self.response,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'is_from_user': self.is_from_user
        }