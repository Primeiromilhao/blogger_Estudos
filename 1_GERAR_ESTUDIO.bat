@echo off
color 0E
echo ======================================================
echo    GERADOR DE ESTÚDIO: COMO É A FACE DE JESUS
echo ======================================================
echo.
cd ..
echo Gerando o arquivo na pasta do repositório...
powershell -ExecutionPolicy Bypass -File Finalizar_Video_Portavel.ps1
echo.
echo ------------------------------------------------------
echo [OK] SUCESSO! O arquivo 'estudio_jesus_face.html' foi criado.
echo ------------------------------------------------------
echo.
pause
