@REM ----------------------------------------------------------------------------
@REM Maven Wrapper - PowerShell-based, downloads Maven binary if needed
@REM ----------------------------------------------------------------------------
@echo off
setlocal EnableDelayedExpansion

SET "MAVEN_PROJECTBASEDIR=%~dp0"
SET "WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties"

@REM Find mvn.cmd via PowerShell (handles arbitrary depth under .m2\wrapper\dists)
FOR /F "delims=" %%M IN ('powershell -NoProfile -Command ^
  "$props = Get-Content '%WRAPPER_PROPERTIES%' | Where-Object { $_ -match '^distributionUrl=' };" ^
  "$url = ($props -split '=', 2)[1].Trim();" ^
  "$name = [IO.Path]::GetFileNameWithoutExtension([IO.Path]::GetFileNameWithoutExtension($url));" ^
  "$dists = Join-Path $env:USERPROFILE '.m2\wrapper\dists';" ^
  "$found = Get-ChildItem $dists -Recurse -Filter 'mvn.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
  "if ($found) { Write-Output $found.FullName } else { Write-Output 'NOT_FOUND' }" ^
') DO SET "MVN_CMD=%%M"

IF "%MVN_CMD%"=="NOT_FOUND" GOTO :download
IF "%MVN_CMD%"=="" GOTO :download
GOTO :run

:download
echo [mvnw] Maven not found in .m2\wrapper\dists. Downloading...
FOR /F "tokens=2 delims==" %%a IN ('findstr /i "distributionUrl" "%WRAPPER_PROPERTIES%"') DO SET "DIST_URL=%%a"
SET "DIST_DIR=%USERPROFILE%\.m2\wrapper\dists\apache-maven-download"
IF NOT EXIST "%DIST_DIR%" MKDIR "%DIST_DIR%"
SET "ZIP_PATH=%DIST_DIR%\maven.zip"
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('!DIST_URL!', '!ZIP_PATH!')"
IF NOT "!ERRORLEVEL!"=="0" ( echo ERROR: Download failed & exit /B 1 )
powershell -NoProfile -Command "Add-Type -AN System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('!ZIP_PATH!', '!DIST_DIR!')"
IF NOT "!ERRORLEVEL!"=="0" ( echo ERROR: Extraction failed & exit /B 1 )
FOR /F "delims=" %%M IN ('powershell -NoProfile -Command "Get-ChildItem '!DIST_DIR!' -Recurse -Filter mvn.cmd | Select-Object -First 1 -ExpandProperty FullName"') DO SET "MVN_CMD=%%M"
IF "%MVN_CMD%"=="" ( echo ERROR: mvn.cmd not found after extraction & exit /B 1 )

:run
"%MVN_CMD%" -f "%MAVEN_PROJECTBASEDIR%pom.xml" %*
