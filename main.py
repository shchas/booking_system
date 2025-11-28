import os
import sys
import threading
import webbrowser
from backend.app import create_app


def open_browser():
    """Открыть браузер после запуска сервера"""
    webbrowser.open_new('http://127.0.0.1:5000')


if __name__ == '__main__':
    # Добавляем папку backend в путь для импортов
    sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

    app = create_app()

    # Запускаем браузер через 1.5 секунды после старта сервера
    threading.Timer(1.5, open_browser).start()

    app.run(debug=False, host='127.0.0.1', port=5000)