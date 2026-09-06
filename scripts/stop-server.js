import { execFileSync } from 'node:child_process';

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', windowsHide: true }).trim();
}

if (process.platform !== 'win32') {
  console.error('当前停止脚本仅支持 Windows。');
  process.exit(1);
}

const output = run('powershell.exe', [
  '-NoProfile',
  '-Command',
  'Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess'
]);
const processIds = [...new Set(output.split(/\s+/).filter(Boolean))];

if (processIds.length === 0) {
  console.log('项目当前没有运行。');
  process.exit(0);
}

for (const processId of processIds) {
  const commandLine = run('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}').CommandLine`
  ]);
  if (!commandLine.includes('server/index.js')) {
    console.error(`端口 3000 被其他程序占用（PID ${processId}），为避免误关，未停止该进程。`);
    process.exit(1);
  }
  execFileSync('taskkill.exe', ['/PID', processId, '/T', '/F'], { stdio: 'inherit', windowsHide: true });
}

console.log('项目服务已停止。');
