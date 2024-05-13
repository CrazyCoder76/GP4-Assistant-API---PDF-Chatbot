import uuid
from app import db
from sqlalchemy.dialects.postgresql import ARRAY
class Chatbot(db.Model):
    id = db.Column(db.Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String(64), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    assistant_id = db.Column(db.String(64), nullable=False)
    file_ids = db.Column(ARRAY(db.String(64)))
    file_names = db.Column(ARRAY(db.String(64)))
    initial = db.Column(db.Text)
    placeholder = db.Column(db.Text)
    suggested = db.Column(db.Text)
    use_custom = db.Column(db.Boolean)
    bot_msg_bg_color = db.Column(db.String(10))
    img_id  = db.Column(db.String(64))
    chatbot_sessions = db.relationship('ChatbotSession',  backref = 'chatbot')