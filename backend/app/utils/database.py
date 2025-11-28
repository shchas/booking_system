from app import db
from app.models import Setting, AdminUser
import json


def init_default_settings():
    """Инициализация настроек по умолчанию"""
    default_settings = {
        'admin_password': 'admin',
        'evening_weekend_pricing': json.dumps({
            'enabled': False,
            'time': '18:00'
        }),
        'karting_settings': json.dumps({
            'open_time': '10:00',
            'close_time': '22:00',
            'session_duration': 15,
            'price_regular': 500,
            'price_race': 700,
            'price_regular_weekend': 600,
            'price_race_weekend': 840,
            'max_karts_per_slot': 6
        }),
        'party_settings': json.dumps({
            'open_time': '10:00',
            'close_time': '22:00',
            'session_duration': 60,
            'price_1_hour': 1000,
            'price_2_hours': 1800,
            'price_1_hour_weekend': 1200,
            'price_2_hours_weekend': 2160
        }),
        'lounge_settings': json.dumps({
            'open_time': '10:00',
            'close_time': '22:00',
            'session_duration': 120,
            'price_1_hour': 800,
            'price_2_hours': 1500,
            'price_1_hour_weekend': 960,
            'price_2_hours_weekend': 1800
        }),
        'virtual_settings': json.dumps({
            'open_time': '10:00',
            'close_time': '22:00',
            'base_duration': 15,
            'max_simulators': 2,
            'duration_prices': {
                '15': {'weekday': 1000, 'weekend': 1200},
                '30': {'weekday': 1800, 'weekend': 2160},
                '45': {'weekday': 2500, 'weekend': 3000},
                '60': {'weekday': 3000, 'weekend': 3600},
                '75': {'weekday': 3500, 'weekend': 4200},
                '90': {'weekday': 4000, 'weekend': 4800}
            }
        }),
        'weekend_calendar': json.dumps({})
    }

    for key, value in default_settings.items():
        if not Setting.query.filter_by(key=key).first():
            setting = Setting(key=key, value=value)
            db.session.add(setting)

    # Создаем администратора по умолчанию
    if not AdminUser.query.filter_by(username='admin').first():
        admin = AdminUser(username='admin')
        admin.set_password('admin')
        db.session.add(admin)

    db.session.commit()


def get_all_settings():
    """Получение всех настроек в виде словаря"""
    settings = Setting.query.all()
    result = {}
    for setting in settings:
        try:
            # Пытаемся распарсить JSON
            result[setting.key] = json.loads(setting.value)
        except (json.JSONDecodeError, TypeError):
            # Если не JSON, возвращаем как есть
            result[setting.key] = setting.value
    return result


def update_settings(settings_dict):
    """Обновление настроек"""
    for key, value in settings_dict.items():
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        Setting.set_setting(key, value)
    db.session.commit()