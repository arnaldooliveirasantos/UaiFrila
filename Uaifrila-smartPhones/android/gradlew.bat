@rem Gradle startup script for Windows - UaiFrila (baixa gradle-wrapper.jar se faltar)
@if "%DEBUG%"=="" @echo off
if "%OS%"=="Windows_NT" setlocal
set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
if defined JAVA_HOME goto findJavaFromJavaHome
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto checkJar
echo ERROR: JAVA_HOME nao setado e 'java' nao encontrado no PATH. Use JDK 17. >&2
goto fail
:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%\bin\java.exe
if exist "%JAVA_EXE%" goto checkJar
echo ERROR: JAVA_HOME invalido: %JAVA_HOME% >&2
goto fail
:checkJar
if exist "%DIRNAME%\gradle\wrapper\gradle-wrapper.jar" goto execute
echo [UaiFrila] gradle-wrapper.jar nao encontrado. Baixando...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/v8.10.2/gradle/wrapper/gradle-wrapper.jar' -OutFile '%DIRNAME%\gradle\wrapper\gradle-wrapper.jar'"
if not exist "%DIRNAME%\gradle\wrapper\gradle-wrapper.jar" (
  echo ERROR: nao consegui baixar gradle-wrapper.jar. Baixe manualmente em: >&2
  echo https://raw.githubusercontent.com/gradle/gradle/v8.10.2/gradle/wrapper/gradle-wrapper.jar >&2
  echo e salve em android\gradle\wrapper\gradle-wrapper.jar >&2
  goto fail
)
:execute
set CLASSPATH=%DIRNAME%\gradle\wrapper\gradle-wrapper.jar
"%JAVA_EXE%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
:end
if %ERRORLEVEL% equ 0 goto mainEnd
:fail
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
exit /b %EXIT_CODE%
:mainEnd
if "%OS%"=="Windows_NT" endlocal
