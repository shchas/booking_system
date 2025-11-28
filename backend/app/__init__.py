import sys
import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()


def get_base_path():
    """Определяем базовый путь в зависимости от режима (exe или разработка)"""
    if getattr(sys, 'frozen', False):
        # Если запущено как exe
        return sys._MEIPASS
    else:
        # Если запущено в режиме разработки
        return os.path.abspath(os.path.dirname(__file__))


def create_app():
    # Определяем путь к фронтенду
    base_path = get_base_path()
    if getattr(sys, 'frozen', False):
        # В exe фронтенд будет в папке frontend рядом с exe
        frontend_path = os.path.join(os.path.dirname(sys.executable), 'frontend')
    else:
        frontend_path = os.path.join(base_path, '../../frontend')

    app = Flask(__name__,
                static_folder=frontend_path,
                template_folder=frontend_path)

    # Конфигурация БД
    if getattr(sys, 'frozen', False):
        # В exe - база рядом с исполняемым файлом
        db_path = os.path.join(os.path.dirname(sys.executable), 'booking.db')
    else:
        # В разработке - в папке instance
        db_path = os.path.join(base_path, '..', 'instance', 'booking.db')

    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Инициализация расширений
    db.init_app(app)
    CORS(app)

    # Маршруты
    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.template_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static_files(path):
        return send_from_directory(app.static_folder, path)

    # Регистрация API маршрутов
    from app.routes.auth import auth_bp
    from app.routes.bookings import bookings_bp
    from app.routes.clients import clients_bp
    from app.routes.settings import settings_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    # Создание таблиц
    with app.app_context():
        db.create_all()

    return app