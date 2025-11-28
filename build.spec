# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],  # Добавьте текущую директорию в путь
    binaries=[],
    datas=[
        ('frontend', 'frontend'),
        ('backend/app/routes', 'app/routes'),
        ('backend/app/utils', 'app/utils'),
        ('backend/app/middleware.py', 'app'),
        ('backend/app/models.py', 'app'),
        ('backend/app/__init__.py', 'app'),
        ('backend/app/config.py', 'app'),
    ],
    hiddenimports=[
        'app.routes.auth',
        'app.routes.bookings',
        'app.routes.clients',
        'app.routes.settings',
        'app.routes.reports',
        'app.utils.database',
        'app.middleware',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='BookingSystem',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Временно оставьте True для отладки
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico',
)