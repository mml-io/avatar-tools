@echo off

REM Enable echoing of commands
echo on

REM Set the working directory to the location of this script
cd %~dp0

REM Create the build directory
REM if not exist ".\build\tools" mkdir ".\build\tools"
mkdir ".\build\tools" 

REM Copy the index.html file that references the different tools into the build directory
copy ".\index.html" ".\build\index.html"

REM Copy the files for each tool into the build directory
xcopy /E /I "..\tools\gltf-avatar-exporter\build" ".\build\tools\gltf-avatar-exporter"

