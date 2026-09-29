import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// Keep the existing Bash runner on macOS/Linux. Native Windows needs neither
// Bash nor the Unix utilities used by dev.sh.
if (process.platform === 'win32') {
  runWindows();
} else {
  const child = spawn('bash', [join(root, 'scripts', 'dev.sh')], {
    cwd: root,
    stdio: 'inherit',
  });
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => child.kill(signal));
  }
  child.on('error', (error) => {
    console.error(`[dev] Could not start Bash: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}

function runWindows() {
  const children = [];
  let stopping = false;

  const hasCommand = (command) => spawnSync('where.exe', [command], {
    stdio: 'ignore',
    windowsHide: true,
  }).status === 0;

  if (!hasCommand('go')) {
    console.error('[dev] Go is not installed or is not on PATH.');
    process.exitCode = 1;
    return;
  }
  const runner = hasCommand('bun') ? 'bun' : 'npm';
  if (!hasCommand(runner)) {
    console.error('[dev] Install Node.js with npm, or Bun, and add it to PATH.');
    process.exitCode = 1;
    return;
  }
  if (!existsSync(join(root, 'frontend', 'node_modules'))) {
    console.warn('[dev] Frontend dependencies are missing. Run make install first.');
  }

  function shutdown(code) {
    if (stopping) return;
    stopping = true;
    console.log('\n[dev] Stopping services...');
    for (const child of children) {
      if (child.pid && child.exitCode === null && child.signalCode === null) {
        // Killing only go/npm would leave the compiled Go server or Next.js
        // running. Restrict cleanup to the process trees this runner owns.
        const result = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'pipe',
          windowsHide: true,
          timeout: 5000,
        });
        if (result.error || result.status !== 0) {
          try {
            process.kill(child.pid, 0);
          } catch (error) {
            if (error.code === 'ESRCH') continue;
          }
          const reason = result.error?.message || result.stderr?.toString().trim() || `exit code ${result.status}`;
          console.error(`[dev] Could not stop process ${child.pid}: ${reason}`);
          code = 1;
        }
      }
    }
    // Let the child output streams drain so startup errors remain visible.
    process.exitCode = code;
    setTimeout(() => process.exit(code), 1000).unref();
  }

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP']) {
    process.on(signal, () => shutdown(0));
  }

  function start(label, command, args, directory) {
    let child;
    try {
      child = spawn(command, args, {
        cwd: join(root, directory),
        // Hidden processes with piped output stay outside the terminal's
        // console; the runner handles Ctrl+C and stops their complete trees.
        // Do not detach: cmd.exe loses its children's output in that mode.
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      console.error(`[${label}] Could not start: ${error.message}`);
      shutdown(1);
      return;
    }
    children.push(child);
    child.on('error', (error) => {
      console.error(`[${label}] Could not start: ${error.message}`);
      shutdown(1);
    });
    child.on('exit', (code, signal) => {
      if (stopping) return;
      console.error(`[${label}] Exited (${signal ?? code}).`);
      shutdown(code || 1);
    });
    for (const stream of [child.stdout, child.stderr].filter(Boolean)) {
      createInterface({ input: stream }).on('line', (line) => {
        console.log(`[${label}] ${line}`);
      });
    }
  }

  console.log('[dev] Frontend: http://localhost:3000');
  console.log('[dev] Backend:  http://localhost:8080');
  console.log('[dev] Press Ctrl+C to stop both services.');

  if (hasCommand('air')) {
    start('backend', 'air', [], 'backend');
  } else {
    start('backend', 'go', ['run', './cmd/server'], 'backend');
  }
  if (stopping) return;
  // npm is a .cmd file on Windows and must be run through cmd.exe. The
  // workspace path is passed as cwd, so spaces in it need no shell escaping.
  if (runner === 'npm') {
    start('frontend', process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run dev'], 'frontend');
  } else {
    start('frontend', 'bun', ['run', 'dev'], 'frontend');
  }
}
