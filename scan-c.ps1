$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root = 'C:\'
$dirs  = [System.Collections.Generic.Dictionary[string,long]]::new([System.StringComparer]::OrdinalIgnoreCase)
$files = [System.Collections.Generic.Dictionary[string,long]]::new([System.StringComparer]::OrdinalIgnoreCase)
$stack = [System.Collections.Generic.Stack[string]]::new()
$stack.Push($root)

$done = 0
while ($stack.Count -gt 0) {
    $dir = $stack.Pop()
    $done++
    if (($done % 20000) -eq 0) { "progress: $done dirs, stack $($stack.Count)" }
    $own = 0L
    $cnt = 0L
    try {
        $di = [System.IO.DirectoryInfo]::new($dir)
        foreach ($fi in $di.EnumerateFiles()) {
            try { $own += $fi.Length; $cnt++ } catch { }
        }
    } catch { }
    $dirs[$dir]  = $own
    $files[$dir] = $cnt
    try {
        foreach ($sd in ([System.IO.DirectoryInfo]::new($dir)).EnumerateDirectories()) {
            try {
                if (($sd.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
            } catch { continue }
            if ($sd.FullName.Length -gt 240) { continue }
            $stack.Push($sd.FullName)
        }
    } catch { }
}

$tot  = [System.Collections.Generic.Dictionary[string,long]]::new([System.StringComparer]::OrdinalIgnoreCase)
$ftot = [System.Collections.Generic.Dictionary[string,long]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($kv in $dirs.GetEnumerator()) {
    $cur = $kv.Key
    $val = $kv.Value
    $fc  = $files[$kv.Key]
    while ($true) {
        if (-not $tot.ContainsKey($cur)) { $tot[$cur] = 0L; $ftot[$cur] = 0L }
        $tot[$cur]  += $val
        $ftot[$cur] += $fc
        $parent = [System.IO.Path]::GetDirectoryName($cur)
        if (-not $parent) { break }
        if ($parent.Length -eq 2) { $parent = $parent + '\' }
        if ($parent -eq $cur) { break }
        $cur = $parent
    }
}

$rows = foreach ($kv in $tot.GetEnumerator()) {
    $p = $kv.Key
    $rel = if ($p -eq 'C:\') { '' } else { $p.Substring(3).TrimEnd('\') }
    $depth = if ($rel -eq '') { 0 } else { ($rel.Split('\')).Count }
    if ($depth -le 4) {
        [pscustomobject]@{ p = $p; rel = $rel; depth = $depth; bytes = $kv.Value; files = $ftot[$p] }
    }
}
$rows = $rows | Sort-Object bytes -Descending
$rows | ConvertTo-Json -Compress -Depth 3 | Set-Content -Path 'C:\Users\InsaneHoo8\Documents\deepseek-harness\default-workspace\c-sizes.json' -Encoding UTF8

"SCAN DONE. dirs=$($dirs.Count) rows=$($rows.Count)"
foreach ($r in ($rows | Where-Object { $_.depth -eq 1 })) {
    "{0,10:N2} GB  {1,9} files  {2}" -f ($r.bytes / 1GB), $r.files, $r.p
}
$rt = $tot['C:\']
"{0,10:N2} GB  TOTAL C:\" -f ($rt / 1GB)
