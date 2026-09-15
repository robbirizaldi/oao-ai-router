@echo off
title OAO AI Router - Portfolio Project
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Creating virtual environment...
    py -m venv .venv
    if errorlevel 1 (
        echo.
        echo Python 3.10+ tidak ditemukan.
        pause
        exit /b 1
    )
)

echo [2/3] Installing dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt

if not exist ".env" (
    copy /Y ".env.example" ".env" >nul
    echo.
    echo File .env dibuat.
    echo Isi OAO_API_KEY dengan API key BARU, lalu jalankan file ini lagi.
    pause
    exit /b 0
)

echo [3/3] Starting local server...
start "" "http://127.0.0.1:5000"
".venv\Scripts\python.exe" app.py
pause
