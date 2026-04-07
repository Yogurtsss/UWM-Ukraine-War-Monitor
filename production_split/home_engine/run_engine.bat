@echo off
TITLE UWM Home Engine - DEBUG MODE
COLOR 0B

cd /d "%~dp0"
echo [1/3] Searching for Python...

:: Find Python
set PYTHON_EXE=python
python --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    for /d %%p in ("%LOCALAPPDATA%\Programs\Python\Python*") do (
        if exist "%%p\python.exe" (
            set PYTHON_EXE="%%p\python.exe"
            goto :FOUND_PYTHON
        )
    )
    echo [ERROR] Python not found!
    pause
    exit /b
)

:FOUND_PYTHON
echo [2/3] Cleaning Python Cache and Updating dependencies...
if exist "__pycache__" rmdir /s /q "__pycache__"
if exist "src\__pycache__" rmdir /s /q "src\__pycache__"

%PYTHON_EXE% -m pip install -r requirements.txt --quiet

echo [3/3] Starting UWM Home Engine...
echo ------------------------------------------
set "PYTHONPATH=%CD%"
:: Running with -u for unbuffered output
%PYTHON_EXE% -u engine_worker.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [CRITICAL ERROR] The engine crashed with exit code %ERRORLEVEL%.
    echo Please copy the error message above and send it to me.
)

echo ------------------------------------------
echo Engine stopped.
pause
