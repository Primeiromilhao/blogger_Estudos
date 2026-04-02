@echo off
color 0B
echo ======================================================
echo    PUBLICADOR AUTOMATICO: BIBLIOTECA PROFÉTICA
echo ======================================================
echo.
echo Sincronizando com o GitHub de dentro do repositório...
echo.
git add .
git commit -m "Publicação final: Estúdio Face de Jesus com CTA Amazon"
git push
echo.
echo ------------------------------------------------------
echo [OK] SUCESSO! O seu site Nova Jerusalém foi atualizado.
echo Verifique em: https://Primeiromilhao.github.io/blogger_Estudos/
echo ------------------------------------------------------
echo.
pause
