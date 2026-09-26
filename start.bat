@echo off
chcp 65001 >nul
title 3D Butortervezo Alkalmazas
echo ========================================================
echo   3D Butortervezo es Katalogus Alkalmazas Inditasa...
echo   Eleresi cim: http://localhost:8585
echo ========================================================
echo.
python server.py 8585 || py server.py 8585
pause
