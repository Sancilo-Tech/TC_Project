# Makes the TC server start with Windows and keep running, using the built-in
# Windows Task Scheduler. Run these from an Administrator terminal:
#
#   npm run autostart:install   set up (or refresh) and start it now
#   npm run autostart:status    show whether it is running
#   npm run autostart:remove    stop it and remove the start-up task
#
# Keep this file plain ASCII: Windows PowerShell misreads other characters
# in a script saved without a byte-order mark.
param(
  [ValidateSet('install', 'status', 'remove')]
  [string]$Command = 'install'
)

$ErrorActionPreference = 'Stop'

$TaskName   = 'TC Server'
$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EnvFile    = Join-Path $ProjectDir '.env'
$LogFile    = Join-Path $ProjectDir 'logs\server.log'

function Stop-WithMessage($message) {
  Write-Host $message -ForegroundColor Red
  exit 1
}

function Assert-Administrator {
  $me = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
  if (-not $me.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'This needs an Administrator terminal.' -ForegroundColor Red
    Write-Host 'Open the Start menu, type "cmd", choose "Run as administrator",'
    Write-Host "then run:  cd /d `"$ProjectDir`"  and the same npm command again."
    exit 1
  }
}

# SERVER_PORT from .env, or the server's default
function Get-ServerPort {
  if (Test-Path $EnvFile) {
    foreach ($line in Get-Content $EnvFile) {
      if ($line -match '^\s*SERVER_PORT\s*=\s*(\d+)') { return [int]$Matches[1] }
    }
  }
  return 4000
}

function Test-ServerPort($port) {
  $client = New-Object Net.Sockets.TcpClient
  try { return $client.ConnectAsync('127.0.0.1', $port).Wait(2000) }
  catch { return $false }
  finally { $client.Close() }
}

# Needed for all three commands: a task that runs as SYSTEM is hidden from
# ordinary users, so even "status" would wrongly report it as missing.
Assert-Administrator

$port = Get-ServerPort
$url  = "http://localhost:$port"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

switch ($Command) {

  'status' {
    if (-not $task) {
      Write-Host 'Auto-start is not installed. Run: npm run autostart:install'
      exit 0
    }
    $info = $task | Get-ScheduledTaskInfo
    Write-Host "Start-up task : $($task.State)"
    Write-Host "Last started  : $($info.LastRunTime)"
    if (Test-ServerPort $port) {
      Write-Host "Server        : running at $url" -ForegroundColor Green
    } else {
      Write-Host "Server        : NOT answering on port $port. See $LogFile" -ForegroundColor Red
    }
  }

  'remove' {
    if (-not $task) {
      Write-Host 'Auto-start is not installed. Nothing to remove.'
      exit 0
    }
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host 'Auto-start removed and the server stopped.'
  }

  'install' {
    if (-not (Test-Path $EnvFile)) {
      Stop-WithMessage "No .env file in $ProjectDir. Create it first (see .env.example)."
    }
    if (-not (Test-Path (Join-Path $ProjectDir 'build\index.html'))) {
      Stop-WithMessage 'The site is not built yet. Run "npm run build" first.'
    }

    # The real node.exe, not a version-manager shim that only works for one user
    try { $node = (& node -p 'process.execPath').Trim() }
    catch { Stop-WithMessage 'Node.js was not found. Install it, open a new terminal and try again.' }

    # Stop the copy that is running now and wait for it to finish: Task Scheduler
    # ignores a start request while the previous run still counts as running.
    if ($task) {
      Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
      foreach ($attempt in 1..10) {
        if ((Get-ScheduledTask -TaskName $TaskName).State -ne 'Running') { break }
        Start-Sleep -Seconds 1
      }
    }

    $keepAlive = Join-Path $ProjectDir 'server\keep-alive.js'
    $action = New-ScheduledTaskAction -Execute $node -Argument "`"$keepAlive`"" -WorkingDirectory $ProjectDir

    # At boot, before anyone signs in
    $trigger   = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

    $settingsArgs = @{
      AllowStartIfOnBatteries    = $true
      DontStopIfGoingOnBatteries = $true
      StartWhenAvailable         = $true
      # The default limit ends a task after 3 days; zero means no limit
      ExecutionTimeLimit         = [TimeSpan]::Zero
      RestartCount               = 3
      RestartInterval            = New-TimeSpan -Minutes 1
    }
    $settings = New-ScheduledTaskSettingsSet @settingsArgs

    $registerArgs = @{
      TaskName    = $TaskName
      Description = 'Transfer Certificate web application'
      Action      = $action
      Trigger     = $trigger
      Principal   = $principal
      Settings    = $settings
      Force       = $true
    }
    Register-ScheduledTask @registerArgs | Out-Null
    Start-ScheduledTask -TaskName $TaskName

    Write-Host 'Start-up task installed. Waiting for the server...'
    $running = $false
    foreach ($attempt in 1..15) {
      Start-Sleep -Seconds 2
      if (Test-ServerPort $port) { $running = $true; break }
    }

    if ($running) {
      Write-Host "The server is running at $url" -ForegroundColor Green
      Write-Host 'It will now start by itself every time Windows starts.'
    } else {
      Stop-WithMessage "The task was installed but the server is not answering on port $port. See $LogFile"
    }
  }
}
