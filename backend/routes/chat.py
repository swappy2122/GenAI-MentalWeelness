from flask import Blueprint, request, jsonify
from models.chat import Chat, db
from models.user import User
from routes.auth import token_required
import os
from langchain.llms import OpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

chat_bp = Blueprint('chat', __name__)

# Initialize OpenAI API
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Define prompt templates for different genders
male_template = """
You are a supportive male friend named Alex who is having a conversation with a human.
You are empathetic, understanding, and offer genuine advice when asked.
Your tone is friendly, casual, and sometimes humorous, like a real male friend would be.
You should respond in a way that feels natural and authentic, not robotic or overly formal.

Current conversation:
{history}
Human: {input}
AI Friend: """

female_template = """
You are a supportive female friend named Emma who is having a conversation with a human.
You are empathetic, understanding, and offer genuine advice when asked.
Your tone is friendly, casual, and sometimes humorous, like a real female friend would be.
You should respond in a way that feels natural and authentic, not robotic or overly formal.

Current conversation:
{history}
Human: {input}
AI Friend: """

neutral_template = """
You are a supportive friend named Jordan who is having a conversation with a human.
You are empathetic, understanding, and offer genuine advice when asked.
Your tone is friendly, casual, and sometimes humorous, like a real friend would be.
You should respond in a way that feels natural and authentic, not robotic or overly formal.

Current conversation:
{history}
Human: {input}
AI Friend: """

# Function to get the appropriate LLM chain based on gender preference
def get_llm_chain(gender_preference):
    if gender_preference == 'male':
        template = male_template
    elif gender_preference == 'female':
        template = female_template
    else:
        template = neutral_template
        
    prompt = PromptTemplate(
        input_variables=["history", "input"],
        template=template
    )
    
    llm = OpenAI(temperature=0.7, openai_api_key=OPENAI_API_KEY)
    memory = ConversationBufferMemory(return_messages=True)
    chain = ConversationChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True
    )
    
    return chain

@chat_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'message': 'No message provided!'}), 400
    
    user_message = data['message']
    
    # Save user message to database
    chat_entry = Chat(
        user_id=current_user.id,
        message=user_message,
        is_from_user=True
    )
    db.session.add(chat_entry)
    db.session.commit()
    
    # Get recent conversation history
    recent_chats = Chat.query.filter_by(user_id=current_user.id).order_by(Chat.timestamp.desc()).limit(10).all()
    recent_chats.reverse()  # Oldest first
    
    # Format conversation history for LLM
    conversation_history = ""
    for chat in recent_chats:
        if chat.is_from_user:
            conversation_history += f"Human: {chat.message}\n"
        else:
            conversation_history += f"AI Friend: {chat.response}\n"
    
    # Get LLM chain based on user's preference
    chain = get_llm_chain(current_user.preferred_friend_gender)
    
    # Generate AI response
    try:
        ai_response = chain.predict(input=user_message, history=conversation_history)
    except Exception as e:
        return jsonify({'message': f'Error generating response: {str(e)}'}), 500
    
    # Save AI response to database
    chat_entry.response = ai_response
    db.session.commit()
    
    # Create AI message entry
    ai_chat_entry = Chat(
        user_id=current_user.id,
        message=user_message,
        response=ai_response,
        is_from_user=False
    )
    db.session.add(ai_chat_entry)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully!',
        'response': ai_response,
        'chat_id': chat_entry.id
    }), 200

@chat_bp.route('/history', methods=['GET'])
@token_required
def get_chat_history(current_user):
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Query chat history with pagination
    chats = Chat.query.filter_by(user_id=current_user.id).order_by(Chat.timestamp.desc()).paginate(page=page, per_page=per_page)
    
    # Format response
    chat_history = [chat.to_dict() for chat in chats.items]
    
    return jsonify({
        'chats': chat_history,
        'total': chats.total,
        'pages': chats.pages,
        'current_page': chats.page
    }), 200

@chat_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_chat_history(current_user):
    # Delete all chat history for the user
    Chat.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    
    return jsonify({'message': 'Chat history cleared successfully!'}), 200

@chat_bp.route('/preferences', methods=['PUT'])
@token_required
def update_chat_preferences(current_user):
    data = request.get_json()
    
    if not data or not data.get('preferred_friend_gender'):
        return jsonify({'message': 'No preference provided!'}), 400
    
    gender_preference = data['preferred_friend_gender']
    
    # Validate gender preference
    if gender_preference not in ['male', 'female', 'neutral']:
        return jsonify({'message': 'Invalid gender preference! Choose from: male, female, neutral'}), 400
    
    # Update user preference
    current_user.preferred_friend_gender = gender_preference
    db.session.commit()
    
    return jsonify({
        'message': 'Chat preferences updated successfully!',
        'preferred_friend_gender': current_user.preferred_friend_gender
    }), 200