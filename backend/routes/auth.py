from flask import Blueprint, request, jsonify
import jwt
import datetime
from models.user import User, db
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)

# JWT Secret Key
JWT_SECRET = os.getenv('JWT_SECRET', 'default-jwt-secret')

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing required fields!'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists!'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists!'}), 409
    
    # Create new user
    preferred_gender = data.get('preferred_friend_gender', 'neutral')
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        preferred_friend_gender=preferred_gender
    )
    
    # Add user to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully!'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password!'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user:
        return jsonify({'message': 'User not found!'}), 404
    
    if user.verify_password(data['password']):
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')
        
        # Update last login
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful!',
            'token': token,
            'user': user.to_dict()
        }), 200
    
    return jsonify({'message': 'Invalid password!'}), 401

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    if data.get('username') and data['username'] != current_user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists!'}), 409
        current_user.username = data['username']
    
    if data.get('email') and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists!'}), 409
        current_user.email = data['email']
    
    if data.get('password'):
        current_user.password_hash = current_user.hash_password(data['password'])
    
    if data.get('preferred_friend_gender'):
        current_user.preferred_friend_gender = data['preferred_friend_gender']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully!',
        'user': current_user.to_dict()
    }), 200