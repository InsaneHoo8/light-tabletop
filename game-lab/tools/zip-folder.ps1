# Zips a folder into a file, keeping forward slashes in entry names (required for xlsx).
param(
  [Parameter(Mandatory=$true)][string]$Folder,
  [Parameter(Mandatory=$true)][string]$Out
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path -LiteralPath $Folder).Path
if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }

$zip = [System.IO.Compression.ZipFile]::Open($Out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $root -Recurse -File | Sort-Object FullName
  # [Content_Types].xml must be first
  $ordered = @()
  $ordered += ($files | Where-Object { $_.Name -eq '[Content_Types].xml' })
  $ordered += ($files | Where-Object { $_.Name -ne '[Content_Types].xml' })
  foreach ($f in $ordered) {
    $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
    $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
  }
}
finally {
  $zip.Dispose()
}
Write-Output ("OK " + $Out)
