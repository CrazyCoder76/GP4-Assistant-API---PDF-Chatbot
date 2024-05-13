from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()

def create_app(config=Config):
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    app.config.from_object(config)
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    
    from .routes import bp as routes_bp
    app.register_blueprint(routes_bp, url_prefix='/api')

    from .models import User
    from .models import Chatbot
    return app  