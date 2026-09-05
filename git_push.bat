@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title GitHub Feltoltes - 3D Butortervezo

echo ========================================================
echo   3D Butortervezo - Git Feltoltes (Push)
echo ========================================================
echo.

echo [1/3] Fajlok hozzaadasa...
git add .
echo.

echo [2/3] Commit letrehozasa...
set "commit_msg="
set /p "commit_msg=Adj meg egy commit uzenetet (vagy nyomj ENTER-t): "

if not defined commit_msg (
    set "commit_msg=Frissites %date% %time%"
)

git commit -m "!commit_msg!"
echo.

echo [3/3] Feltoltes a GitHubra (origin main)...
git push origin main
echo.

if !errorlevel! equ 0 (
    echo ========================================================
    echo   [SIKERES] A modositasok felkerultek a GitHubra!
    echo ========================================================
) else (
    echo ========================================================
    echo   [HIBA] Nem sikerult a feltoltes.
    echo ========================================================
)

echo.
pause
