@echo on
:: DEBUG MODE ACTIVATED
TITLE UWM Home Engine - Debugger

echo [DEBUG] Checking for project files...
if not exist engine_worker.py (
    echo [ERROR] engine_worker.py not found in this folder!
    pause
    exit /b
)

:: Use simpler way to find python
set PYTHON_EXE=python
python --version 
if %ERRORLEVEL% neq 0 (
    echo [STATUS] Searching via system check...
    where python
    if %ERRORLEVEL% neq 0 (
        :: Try hardcoded common paths
        if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
            set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        )
    )
)

echo [DEBUG] Using Python: %PYTHON_EXE%
pause

echo [STATUS] Running...
set "PYTHONPATH=%CD%"

%PYTHON_EXE% engine_worker.py
@echo -------------------------------------------------------
echo [DEBUG] Process ended. 
pause
