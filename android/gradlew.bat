@echo off
setlocal

set APP_HOME=%~dp0
set GRADLE_HOME=c:\Users\ibrah\Documents\Gemini\Christian_App\gradle-distr\gradle-8.14.3

"%GRADLE_HOME%\bin\gradle.bat" %*
