@echo off
echo ========================================
echo NPF Smart SITREP System Setup
echo ========================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Initializing database...
cd backend
python init_db.py
if errorlevel 1 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo To start the application:
echo   1. Run start_backend.bat (in a separate window)
echo   2. Run start_frontend.bat (in a separate window)
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3010
echo API Docs: http://localhost:8000/docs
echo.
pause
