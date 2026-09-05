@echo off
chcp 65001 >nul
title 3D Bútortervező Alkalmazás
echo ========================================================
echo   3D Bútortervező és Katalógus Alkalmazás Indítása...
echo ========================================================
echo.
python server.py || py server.py
pause
