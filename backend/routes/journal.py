from flask import Blueprint, request, jsonify
from models.journal import Journal, db
from routes.auth import token_required
from datetime import datetime

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/', methods=['POST'])
@token_required
def create_journal(current_user):
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Missing title or content!'}), 400
    
    # Create new journal entry
    new_journal = Journal(
        user_id=current_user.id,
        title=data['title'],
        content=data['content']
    )
    
    # Add journal to database
    db.session.add(new_journal)
    db.session.commit()
    
    return jsonify({
        'message': 'Journal created successfully!',
        'journal': new_journal.to_dict()
    }), 201

@journal_bp.route('/', methods=['GET'])
@token_required
def get_journals(current_user):
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Query journals with pagination
    journals = Journal.query.filter_by(user_id=current_user.id).order_by(Journal.updated_at.desc()).paginate(page=page, per_page=per_page)
    
    # Format response
    journal_list = [journal.to_dict() for journal in journals.items]
    
    return jsonify({
        'journals': journal_list,
        'total': journals.total,
        'pages': journals.pages,
        'current_page': journals.page
    }), 200

@journal_bp.route('/<int:journal_id>', methods=['GET'])
@token_required
def get_journal(current_user, journal_id):
    # Get journal by ID
    journal = Journal.query.filter_by(id=journal_id, user_id=current_user.id).first()
    
    if not journal:
        return jsonify({'message': 'Journal not found!'}), 404
    
    return jsonify({'journal': journal.to_dict()}), 200

@journal_bp.route('/<int:journal_id>', methods=['PUT'])
@token_required
def update_journal(current_user, journal_id):
    # Get journal by ID
    journal = Journal.query.filter_by(id=journal_id, user_id=current_user.id).first()
    
    if not journal:
        return jsonify({'message': 'Journal not found!'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided!'}), 400
    
    # Update journal fields
    if data.get('title'):
        journal.title = data['title']
    
    if data.get('content'):
        journal.content = data['content']
    
    journal.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Journal updated successfully!',
        'journal': journal.to_dict()
    }), 200

@journal_bp.route('/<int:journal_id>', methods=['DELETE'])
@token_required
def delete_journal(current_user, journal_id):
    # Get journal by ID
    journal = Journal.query.filter_by(id=journal_id, user_id=current_user.id).first()
    
    if not journal:
        return jsonify({'message': 'Journal not found!'}), 404
    
    # Delete journal
    db.session.delete(journal)
    db.session.commit()
    
    return jsonify({'message': 'Journal deleted successfully!'}), 200

@journal_bp.route('/search', methods=['GET'])
@token_required
def search_journals(current_user):
    # Get search query
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'message': 'No search query provided!'}), 400
    
    # Search journals by title or content
    journals = Journal.query.filter_by(user_id=current_user.id).filter(
        (Journal.title.ilike(f'%{query}%') | Journal.content.ilike(f'%{query}%'))
    ).order_by(Journal.updated_at.desc()).all()
    
    # Format response
    journal_list = [journal.to_dict() for journal in journals]
    
    return jsonify({
        'journals': journal_list,
        'count': len(journal_list)
    }), 200