@echo off
echo Starting NPF SITREP System...
echo.

echo [1/2] Starting Backend Server on port 8000...
start "NPF Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server on port 3010...
start "NPF Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting in separate windows
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3010
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
