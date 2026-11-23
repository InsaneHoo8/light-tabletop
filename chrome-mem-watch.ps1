$ErrorActionPreference = 'Continue'
$out = Join-Path $PSScriptRoot 'chrome-mem-log.csv'
$sys = Join-Path $PSScriptRoot 'chrome-mem-system.csv'
foreach ($f in @($out, $sys)) { if (Test-Path $f) { Remove-Item $f -Force } }
"ts,pid,type,ws_mb,priv_mb,cpu_s" | Out-File -FilePath $out -Encoding ASCII
"ts,avail_mb,load_pct" | Out-File -FilePath $sys -Encoding ASCII

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CliW {
  [StructLayout(LayoutKind.Sequential)] public struct PBI { public IntPtr R1; public IntPtr Peb; public IntPtr A; public IntPtr B; public IntPtr Pid; public IntPtr C; }
  [DllImport("ntdll.dll")] static extern int NtQueryInformationProcess(IntPtr h, int cls, ref PBI p, int len, out int r);
  [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(int a, bool i, int pid);
  [DllImport("kernel32.dll")] static extern bool ReadProcessMemory(IntPtr h, IntPtr a, byte[] b, int s, out IntPtr r);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  public static string Get(int pid) {
    IntPtr h = OpenProcess(0x0410, false, pid); if (h == IntPtr.Zero) return "";
    try {
      PBI p = new PBI(); int rl;
      if (NtQueryInformationProcess(h, 0, ref p, Marshal.SizeOf(p), out rl) != 0) return "";
      byte[] b = new byte[16]; IntPtr br;
      if (!ReadProcessMemory(h, p.Peb + 0x20, b, 16, out br)) return "";
      long pp = BitConverter.ToInt64(b, 0);
      byte[] l = new byte[8]; byte[] q = new byte[8];
      if (!ReadProcessMemory(h, (IntPtr)(pp + 0x70), l, 8, out br)) return "";
      if (!ReadProcessMemory(h, (IntPtr)(pp + 0x78), q, 8, out br)) return "";
      int len = BitConverter.ToUInt16(l, 0);
      long qp = BitConverter.ToInt64(q, 0);
      if (len <= 0 || len > 32768) return "";
      byte[] cl = new byte[len];
      if (!ReadProcessMemory(h, (IntPtr)qp, cl, len, out br)) return "";
      return Encoding.Unicode.GetString(cl);
    } finally { CloseHandle(h); }
  }
}
"@
Add-Type -TypeDefinition $code

$code2 = @"
using System;
using System.Runtime.InteropServices;
public class MemW {
  [StructLayout(LayoutKind.Sequential)]
  public struct MS { public uint dwLength; public uint dwMemoryLoad; public ulong ullTotalPhys; public ulong ullAvailPhys; public ulong ullTotalPageFile; public ulong ullAvailPageFile; public ulong ullTotalVirtual; public ulong ullAvailVirtual; public ulong ullAvailExtendedVirtual; }
  [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GlobalMemoryStatusEx(ref MS m);
  public static string Get() {
    MS m = new MS(); m.dwLength = (uint)Marshal.SizeOf(m);
    if (!GlobalMemoryStatusEx(ref m)) return "0,0";
    return string.Format("{0:F0},{1}", m.ullAvailPhys / 1048576.0, m.dwMemoryLoad);
  }
}
"@
Add-Type -TypeDefinition $code2

for ($i = 0; $i -lt 16; $i++) {
  $ts = (Get-Date).ToString('HH:mm:ss')
  foreach ($p in (Get-Process chrome -ErrorAction SilentlyContinue)) {
    $cl = [CliW]::Get($p.Id)
    $t = 'other'
    if ($cl -match '--type=renderer') { $t = 'tab' }
    if ($cl -match '--extension-process') { $t = 'ext' }
    if ($cl -match '--type=gpu-process') { $t = 'gpu' }
    if ($cl -match '--utility-sub-type=storage') { $t = 'storage' }
    if ($cl -match '--utility-sub-type=audio') { $t = 'audio' }
    if ($cl -match '--type=utility' -and $t -eq 'other') { $t = 'utility' }
    $ws = [math]::Round($p.WorkingSet64 / 1MB)
    $pv = [math]::Round($p.PrivateMemorySize64 / 1MB)
    $cp = [math]::Round($p.TotalProcessorTime.TotalSeconds)
    "$ts,$($p.Id),$t,$ws,$pv,$cp" | Out-File -FilePath $out -Append -Encoding ASCII
  }
  "$ts,$([MemW]::Get())" | Out-File -FilePath $sys -Append -Encoding ASCII
  if ($i -lt 15) { Start-Sleep -Seconds 60 }
}
"DONE" | Out-File -FilePath $out -Append -Encoding ASCII
