import os
from typing_extensions import override
import uuid
from flask import Blueprint, request, send_from_directory
from openai import AssistantEventHandler, OpenAI, chat
from sqlalchemy import UUID
from sqlalchemy.orm.session import make_transient
from sqlalchemy.orm.attributes import flag_modified
from app.models.Chatbot import Chatbot
from app.models.ChatbotSession import ChatbotSession
from auth_middleware import token_required
from ..models.User import User
from .. import db
from .. import bcrypt
from app import Config
import re
import jwt
import datetime
import time
from google.oauth2 import id_token
from google.auth.transport import requests

client = OpenAI(api_key=Config.OPENAI_KEY)

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if re.match(pattern, email):
        return True
    else:
        return False
    
def validate_email_and_password(email, password):
    user = User.query.filter_by(email=email).first()
    if user is None or user.password is None:
        return None
    if bcrypt.check_password_hash(user.password, password) is False:
        return None
    return user

bp = Blueprint('routes', __name__)


@bp.route('/user_info', methods=['POST'])
@token_required
def user_info(current_user):
    return {
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'email': current_user.email
    }

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    first_name = data['first_name']
    last_name = data['last_name']
    email = data['email']
    password = data['password']
    if not email or not password or not first_name or not last_name:
        return {'message': 'Fill all fields'}, 400
    if len(password) < 6:
        return {'message' : 'Password length must be at least 6!'}, 400
    user = User.query.filter_by(email=email).first()
    if user != None:
        return {'message' : 'Same email already exists'}, 400
    if not is_valid_email(email):
        return {'message' : 'Not valid email'}, 400
    # Here you would normally hash the password before saving
    user = User(
        email = email,
        password = bcrypt.generate_password_hash(password, 10).decode('utf-8'),
        first_name = first_name,
        last_name = last_name
    )
    db.session.add(user)
    db.session.commit()
    return {}

@bp.route('/login', methods = ['POST'])
def login():
    data = request.json
    if not data:
        return {"message": "Please provide user details!",}, 400
    validated_user = validate_email_and_password(data['email'], data['password'])
    if validated_user is None:
        return {'message' : 'Credentials not correct!'}, 401
    
    token = jwt.encode({
        'user_id' : validated_user.id,
        'exp': datetime.datetime.now() + datetime.timedelta(hours=24)
        }, Config.SECRET_KEY)
    
    return {'token' : token, 'user': {
        'id': validated_user.id,
        'email': validated_user.email,
        'first_name': validated_user.first_name,
        'last_name': validated_user.last_name
    }}

@bp.route('/oauth', methods = ['POST'])
def oauth():
    token = request.json['credential']
    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), Config.GOOGLE_CLIENT_ID)

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        user_id = idinfo['sub']
        
        # You can also get other information from the token
        email = idinfo.get('email')
        user = User.query.filter_by(email=email).first()
        first_name, last_name = '', ''
        if user is None:
            name = idinfo.get('name')
            first_name,last_name = name.split(' ')
            user = User(
                email = email,
                first_name = first_name,
                last_name = last_name
            )
            db.session.add(user)
            db.session.commit()
        else:
            first_name, last_name = user.first_name, user.last_name
            # You might want to create a user in your DB with this information, or update an existing one
        token = jwt.encode({
            'user_id' : user.id,
            'exp': datetime.datetime.now() + datetime.timedelta(hours=24)
            }, Config.SECRET_KEY)
        return {
            'token' : token,
            'user': {
                'id': user.id,
                'email': email,
                'first_name': first_name,
                'last_name': last_name}
            }, 200
    except ValueError:
        # Invalid token
        pass
    return {'message':"Token is invalid or expired"}, 401

@bp.route('/add_bot', methods = ['POST'])
@token_required
def add_bot(current_user):
    data = request.form
    if not data['name'] or not data['prompt']:
        return {'message':'Please fill all fields'}, 400
    files = request.files
    file_ids = []
    file_names = []
    for key, storage in files.items(multi=True):
        path = f"upload/{uuid.uuid4().hex}"
        storage.save(path)
        file = open(path, 'rb')
        file_ids.append(client.files.create(
            file=file,
            purpose='assistants'
        ).id)
        file_names.append(storage.filename)
        file.close()
        os.remove(path)
    assistant = client.beta.assistants.create(
        name=data['name'],
        instructions=data['prompt'],
        tools=[{"type": "retrieval"}],
        model="gpt-4-turbo-preview",
        file_ids=file_ids,
    )
    chatbot = Chatbot(
        name = data['name'],
        prompt = data['prompt'],
        user_id = current_user.id,
        assistant_id = assistant.id,
        file_ids = file_ids,
        file_names = file_names,
        initial = 'Hi! How can I help you today?',
        suggested = 'Hello!\nWhat is chatbot?',
        placeholder = 'Wrtie your sentences here',
        use_custom = False,
        bot_msg_bg_color = '#000000'
    )
    db.session.add(chatbot)
    db.session.commit()
    return {
        'id': chatbot.id,
        'name': chatbot.name
    }

@bp.route('/get_ai_response', methods=['POST'])
@token_required
def get_ai_resposne(current_user):
    session_id = request.json['session_id']
    chatbot_session = ChatbotSession.query.filter_by(id=session_id).first()
    if chatbot_session is None:
        return {'message':'Session not found'}, 500
    message = request.json['message']
    message = client.beta.threads.messages.create(
        thread_id=session_id,
        role='user',
        content=message
    )
    return {'assistant_id':chatbot_session.chatbot.assistant_id, 'key': Config.OPENAI_KEY}
    # with client.beta.threads.runs.create_and_stream(
    #     thread_id=session_id,
    #     assistant_id=chatbot_session.chatbot.assistant_id,
    #     event_handler=EventHandler(),
    #     ) as stream:
    #     stream.until_done()

    # run = client.beta.threads.runs.create(
    #     thread_id=session_id,
    #     assistant_id=chatbot_session.chatbot.assistant_id
    # )
    # while run.status in ['queued', 'in_progress', 'cancelling']:
    #     time.sleep(1) # Wait for 1 second
    #     run = client.beta.threads.runs.retrieve(
    #         thread_id=session_id,
    #         run_id=run.id
    #     )
    # if run.status == 'completed': 
    #     messages = client.beta.threads.messages.list(
    #         thread_id=session_id
    #     )

    #     message_content = messages.data[0].content[0].text
    #     annotations = message_content.annotations
    #     citations = []

    #     # Iterate over the annotations and add footnotes
    #     for index, annotation in enumerate(annotations):
    #         # Replace the text with a footnote
    #         message_content.value = message_content.value.replace(annotation.text, f' [{index}]')

    #         # Gather citations based on annotation attributes
    #         if (file_citation := getattr(annotation, 'file_citation', None)):
    #             cited_file = client.files.retrieve(file_citation.file_id)
    #             citations.append(f'[{index}] {file_citation.quote} from {cited_file.filename}')
    #         elif (file_path := getattr(annotation, 'file_path', None)):
    #             cited_file = client.files.retrieve(file_path.file_id)
    #             citations.append(f'[{index}] Click <here> to download {cited_file.filename}')
    #             # Note: File download functionality not implemented above for brevity

    #     # Add footnotes to the end of the message before displaying to user
    #     message_content.value += '\n' + '\n'.join(citations)
    #     return message_content.value
    # else:
    #     return {'message': 'Error occured'}, 500

@bp.route('/create_session', methods=['POST'])
@token_required
def create_session(current_user):
    chatbot_id = request.json['chatbot_id']
    thread = client.beta.threads.create()
    chatbot_session = ChatbotSession(
        id= thread.id,
        user_id=current_user.id,
        chatbot_id=chatbot_id
    )
    db.session.add(chatbot_session)
    db.session.commit()
    return thread.id

@bp.route('/chatbot_list', methods = ['POST'])
@token_required
def chatbot_list(current_user):
    return  [{
            'id': chatbot.id,
            'name': chatbot.name
    } for chatbot in Chatbot.query.filter_by(user_id = current_user.id)]

@bp.route('/get_model_info', methods=['POST'])
@token_required
def get_model_info(current_user):
    bot = Chatbot.query.filter_by(id=request.json['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    return {
        'id':bot.id,
        'name':bot.name,
        'prompt':bot.prompt,
        'file_names':bot.file_names,
        'file_ids':bot.file_ids
    }

@bp.route('/update_model_info', methods=['POST'])
@token_required
def update_model_info(current_user):
    bot = Chatbot.query.filter_by(id=request.json['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    bot.name = request.json['name']
    bot.prompt = request.json['prompt']
    db.session.commit()
    return "success"

@bp.route('/delete_file', methods=['POST'])
@token_required
def delete_file(current_user):
    bot = Chatbot.query.filter_by(id=request.json['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    for file_id in bot.file_ids:
        try:
            response = client.beta.assistants.files.delete(assistant_id=bot.assistant_id, file_id=file_id)
            print(response)
        except Exception as e:
            print(f"Error deleting file {file_id} for chatbot ID {bot.id}: {e}. Continuing...")
    index = bot.file_ids.index(request.json['file_id'])
    bot.file_ids.pop(index)
    bot.file_names.pop(index)
    flag_modified(bot, 'file_ids')
    flag_modified(bot, 'file_names')
    db.session.commit()
    return "success"

@bp.route('/update_files', methods=['POST'])
@token_required
def update_files(current_user):
    bot = Chatbot.query.filter_by(id=request.form['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    files = request.files
    file_ids = []
    file_names = []
    for key, storage in files.items(multi=True):
        path = f"upload/{uuid.uuid4().hex}"
        storage.save(path)
        file = open(path, 'rb')
        file_ids.append(client.files.create(
            file=file,
            purpose='assistants'
        ).id)
        file_names.append(storage.filename)
        file.close()
        os.remove(path)
    bot.file_ids.extend(file_ids)
    client.beta.assistants.update(assistant_id=bot.assistant_id, file_ids=bot.file_ids)
    bot.file_names.extend(file_names)
    flag_modified(bot,'file_ids')
    flag_modified(bot,'file_names')
    db.session.commit()
    return {
        'file_ids': file_ids,
        'file_names': file_names
    }
    
@bp.route('/get_chatbot_setting', methods = ['POST'])
@token_required
def get_chatbot_setting(current_user):
    bot = Chatbot.query.filter_by(id=request.json['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    return {
        'initial' : bot.initial,
        'placeholder' : bot.placeholder,
        'suggested' : bot.suggested,
        'use_custom' : bot.use_custom,
        'bot_msg_bg_color' : bot.bot_msg_bg_color,
        'img_id' : bot.img_id
    }

@bp.route('/chatbot_setting_session', methods = ['POST'])
@token_required
def chatbot_setting_session(current_user):
    session = ChatbotSession.query.filter_by(id=request.json['id'], user_id = current_user.id).first()
    if session is None:
        return {'message':'You are not allowed to see others setting'}, 400
    bot = session.chatbot
    return {
        'initial' : bot.initial,
        'placeholder' : bot.placeholder,
        'suggested' : bot.suggested,
        'use_custom' : bot.use_custom,
        'bot_msg_bg_color' : bot.bot_msg_bg_color,
        'img_id' : bot.img_id
    }

@bp.route('/update_chatbot_setting', methods = ['POST'])
@token_required
def update_chatbot_setting(current_user):
    bot = Chatbot.query.filter_by(id=request.form['id'], user_id = current_user.id).first()
    if bot is None:
        return {'message':'You are not allowed to see others setting'}, 400
    if len(request.files) > 0:
        file_key = next(iter(request.files))
        file = request.files[file_key]
        if file:
            img_id = uuid.uuid4().hex
            file.save(f"app/avatar/{img_id}")
    bot.initial = request.form['initial']
    bot.placeholder = request.form['placeholder']
    bot.suggested = request.form['suggested']
    bot.use_custom = True if request.form['use_custom'] == 'true' else False
    bot.bot_msg_bg_color = request.form['bot_msg_bg_color']
    if len(request.files) > 0:
        bot.img_id = img_id
    db.session.commit()
    return "success"
@bp.route('/avatar/<img_id>')
def get_image(img_id):
    return send_from_directory('avatar', img_id)

@bp.route('/clear_bots', methods=['GET'])
def clear_bots():
    for bot_session in ChatbotSession.query.all():
        try:
            response = client.beta.threads.delete(thread_id=bot_session.id)
            print(response)
        except Exception as e:
            print(f"Error deleting thread for bot_session ID {bot_session.id}: {e}. Continuing...")

    # Attempt to delete Chatbots, their files, and assistants
    for chatbot in Chatbot.query.all():
        for file_id in chatbot.file_ids:
            try:
                response = client.beta.assistants.files.delete(assistant_id=chatbot.assistant_id, file_id=file_id)
                print(response)
            except Exception as e:
                print(f"Error deleting file {file_id} for chatbot ID {chatbot.id}: {e}. Continuing...")
        try:
            response = client.beta.assistants.delete(assistant_id=chatbot.assistant_id)
            print(response)
        except Exception as e:
            print(f"Error deleting assistant for chatbot ID {chatbot.id}: {e}. Continuing...")
    db.session.query(ChatbotSession).delete()
    db.session.query(Chatbot).delete()
    db.session.commit()
    return "successfull"