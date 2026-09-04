import os
import json
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask

def create_app(config_path=None):
    app = Flask(
        __name__,
        template_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates')),
        static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))
    )

    # Base directory for the project
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    if config_path is None:
        config_path = os.path.join(base_dir, 'config.json')

    # Load configuration
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            app.config['MEDIA_CONFIG'] = json.load(f)
    else:
        app.config['MEDIA_CONFIG'] = {
            "server_name": "Android TV Media Server",
            "port": 8080,
            "host": "0.0.0.0",
            "authentication": False,
            "username": "admin",
            "password": "adminpassword",
            "secret_key": "termux-tv-media-secret-key",
            "show_hidden_files": False,
            "chunk_size_kb": 1024,
            "theme": "dark",
            "storages": [
                {"name": "Internal Storage", "path": "/sdcard"},
                {"name": "Download", "path": "/sdcard/Download"},
                {"name": "Movies", "path": "/sdcard/Movies"}
            ]
        }
    
    app.config['CONFIG_PATH'] = config_path
    app.secret_key = app.config['MEDIA_CONFIG'].get('secret_key', 'termux-android-tv-secret')

    # Setup Logging directory and rotating file handler
    logs_dir = os.path.join(base_dir, 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    log_file = os.path.join(logs_dir, 'server.log')

    logger = logging.getLogger('tv_media_server')
    logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers on re-init
    if not logger.handlers:
        file_handler = RotatingFileHandler(log_file, maxBytes=2 * 1024 * 1024, backupCount=3, encoding='utf-8')
        file_handler.setFormatter(logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s'))
        logger.addHandler(file_handler)

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s'))
        logger.addHandler(console_handler)

    app.media_logger = logger
    logger.info("Local Media Server initialized")

    # Register routes blueprint
    from .routes import main_bp
    app.register_blueprint(main_bp)

    return app
