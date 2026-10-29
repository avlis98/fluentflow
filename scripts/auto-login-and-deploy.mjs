import { spawn, execSync } from 'child_process';

const GH_PATH = 'C:\\Program Files\\GitHub CLI\\gh.exe';

console.log('Starting GitHub Web Authorization...');

const child = spawn(
  GH_PATH,
  ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'],
  { stdio: ['pipe', 'pipe', 'pipe'] }
);

let codeCopied = false;

function handleOutput(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);

  const match = text.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
  if (match && !codeCopied) {
    codeCopied = true;
    const code = match[1];
    try {
      execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${code}'; Start-Process 'https://github.com/login/device'"`);
      console.log(`\n========================================================`);
      console.log(`🔑 CÓDIGO COPIADO PARA SEU CTRL+V: ${code}`);
      console.log(`🌐 Janela https://github.com/login/device aberta no navegador!`);
      console.log(`========================================================\n`);
    } catch (e) {
      console.error('Could not copy to clipboard:', e.message);
    }
    try {
      child.stdin.write('\n');
    } catch {}
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('close', (exitCode) => {
  if (exitCode !== 0) {
    console.error(`gh auth login exited with code ${exitCode}`);
    process.exit(exitCode || 1);
  }

  console.log('\n✅ GitHub autorizado com sucesso! Iniciando deploy automático no GitHub Pages...\n');
  try {
    const token = execSync(`"${GH_PATH}" auth token`, { encoding: 'utf8' }).trim();
    execSync('node scripts/deploy-gh-pages.mjs', {
      stdio: 'inherit',
      env: { ...process.env, GH_TOKEN: token },
    });
  } catch (err) {
    console.error('Deploy failed:', err.message);
    process.exit(1);
  }
});
