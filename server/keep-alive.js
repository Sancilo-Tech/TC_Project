// Runs the server and starts it again if it ever stops. Used by the Windows
// start-up task (server/scripts/autostart.ps1). That task has no console, so
// everything the server prints goes to logs/server.log instead.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const RESTART_DELAY_MS = 5000;
const MAX_LOG_BYTES = 5 * 1024 * 1024;

const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'server.log');

let child = null;

function openLog() {
  fs.mkdirSync(logDir, { recursive: true });
  // Keep one previous file so the log cannot grow without limit
  if (fs.existsSync(logFile) && fs.statSync(logFile).size > MAX_LOG_BYTES) {
    fs.renameSync(logFile, `${logFile}.old`);
  }
  return fs.openSync(logFile, 'a');
}

const stamp = () => new Date().toISOString();

function start() {
  const log = openLog();
  fs.writeSync(log, `[${stamp()}] starting server\n`);

  child = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
    stdio: ['ignore', log, log],
    windowsHide: true,
  });

  child.on('exit', code => {
    fs.writeSync(log, `[${stamp()}] server stopped (exit code ${code}), starting again in ${RESTART_DELAY_MS / 1000}s\n`);
    fs.closeSync(log);
    setTimeout(start, RESTART_DELAY_MS);
  });
}

// Stopping this process stops the server with it
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (child) child.kill();
    process.exit(0);
  });
}

start();
