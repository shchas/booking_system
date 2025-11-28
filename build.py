import os
import subprocess
import sys


def find_py_files(directory):
    """Найти все .py файлы в директории"""
    py_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                relative_path = os.path.relpath(root, 'backend')
                py_files.append((os.path.join(root, file), os.path.join('app', relative_path)))
    return py_files


def build_spec():
    """Динамически создать spec файл со всеми зависимостями"""

    # Найти все Python файлы в backend
    backend_files = find_py_files('backend/app')

    # Создать содержимое spec файла
    spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('frontend', 'frontend'),
        {backend_files}
    ],
    hiddenimports=[
        'app.routes.auth',
        'app.routes.bookings',
        'app.routes.clients', 
        'app.routes.settings',
        'app.routes.reports',
        'app.utils.database',
        'app.middleware',
        'flask',
        'flask_sqlalchemy',
        'flask_cors',
    ],
    hookspath=[],
    hooksconfig={{}},
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
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico',
)
'''

    with open('build.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)


if __name__ == '__main__':
    build_spec()
    print("Spec file generated. Building EXE...")
    subprocess.run(['pyinstaller', 'build.spec'])