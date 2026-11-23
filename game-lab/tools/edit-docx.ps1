# Applies text/regex replacements and paragraph deletion inside word/document.xml. ASCII only.
param(
  [Parameter(Mandatory=$true)][string]$Root,
  [Parameter(Mandatory=$true)][string]$Json
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$edits = (Get-Content -LiteralPath $Json -Raw -Encoding UTF8) | ConvertFrom-Json

foreach ($e in $edits) {
  $path = Join-Path $Root $e.file
  if (-not (Test-Path -LiteralPath $path)) { Write-Output ("MISSING " + $e.file); continue }

  $zip = [System.IO.Compression.ZipFile]::Open($path, [System.IO.Compression.ZipArchiveMode]::Update)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    $sr = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
    $xml = $sr.ReadToEnd()
    $sr.Close()

    $new = $xml

    if ($e.mode -eq "deleteParagraph") {
      $at = $new.IndexOf($e.find)
      if ($at -ge 0) {
        $start = $new.LastIndexOf("<w:p ", $at)
        if ($start -lt 0) { $start = $new.LastIndexOf("<w:p>", $at) }
        $stop = $new.IndexOf("</w:p>", $at)
        if ($start -ge 0 -and $stop -gt $start) {
          $new = $new.Substring(0, $start) + $new.Substring($stop + 6)
        }
      }
    }
    elseif ($e.mode -eq "regex") {
      $new = [regex]::Replace($new, $e.find, $e.repl)
    }
    else {
      $new = $new.Replace($e.find, $e.repl)
    }

    if ($new -eq $xml) {
      Write-Output ("NOCHANGE " + $e.file)
    } else {
      $entry.Delete()
      $ne = $zip.CreateEntry("word/document.xml", [System.IO.Compression.CompressionLevel]::Optimal)
      $sw = New-Object System.IO.StreamWriter($ne.Open(), (New-Object System.Text.UTF8Encoding($false)))
      $sw.Write($new)
      $sw.Close()
      Write-Output ("OK " + $e.file + " [" + $e.mode + "]")
    }
  }
  finally {
    $zip.Dispose()
  }
}
