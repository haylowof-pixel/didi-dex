const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const exePath = path.resolve('release/win-unpacked/OVERSEER.exe');
const icoPath = path.resolve('public/icon.ico');
const lnkPath = path.join(os.homedir(), 'Desktop', 'OVERSEER.lnk');

const psScript = `
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("${lnkPath.replace(/\\/g, '\\\\')}")
$s.TargetPath = "${exePath.replace(/\\/g, '\\\\')}"
$s.IconLocation = "${icoPath.replace(/\\/g, '\\\\')},0"
$s.WorkingDirectory = "${path.dirname(exePath).replace(/\\/g, '\\\\')}"
$s.Save()
`;

execSync(`powershell -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { stdio: 'inherit' });
console.log('Shortcut created:', lnkPath);
