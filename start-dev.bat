@echo off
echo ========================================
echo  VerificaYa - Servidor de Desarrollo
echo ========================================
echo.
echo Blog mejorado con texto oscuro
echo.
cd /d "%~dp0"
echo Iniciando en: %CD%
echo.
echo Accede a:
echo - Landing: http://localhost:3000
echo - Blog: http://localhost:3000/blog
echo.
npm run dev
