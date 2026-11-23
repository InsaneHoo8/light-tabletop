# Builds one artifact docx per world from artifacts.json, using the fantasy docx as a style template.
# ASCII only: every Russian string comes from the JSON file.
param(
  [Parameter(Mandatory=$true)][string]$Root,
  [Parameter(Mandatory=$true)][string]$Json,
  [Parameter(Mandatory=$true)][string]$Template
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

function Esc([string]$s) {
  if ($null -eq $s) { return "" }
  return [System.Security.SecurityElement]::Escape($s)
}

$cfg = (Get-Content -LiteralPath $Json -Raw -Encoding UTF8) | ConvertFrom-Json
$L = $cfg.labels

foreach ($w in $cfg.worlds) {
  $sb = New-Object System.Text.StringBuilder

  [void]$sb.Append('<w:p><w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:pPr>')
  [void]$sb.Append('<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">' + (Esc $w.title) + '</w:t></w:r></w:p>')

  foreach ($c in $w.cards) {
    [void]$sb.Append('<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>')
    [void]$sb.Append('<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">' + (Esc $c.name) + '</w:t></w:r></w:p>')

    $details = @(
      @($L.effect, (" " + $c.effect)),
      @($L.cost, (" " + $c.costText)),
      @($L.trade, (" " + $c.tradeText))
    )
    foreach ($d in $details) {
      [void]$sb.Append('<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr>')
      [void]$sb.Append('<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">' + (Esc $d[0]) + '</w:t></w:r>')
      [void]$sb.Append('<w:r><w:t xml:space="preserve">' + (Esc $d[1]) + '</w:t></w:r></w:p>')
    }
  }

  $body = $sb.ToString()
  $dir = Join-Path $Root $w.dir
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $target = Join-Path $dir $w.file
  Copy-Item -LiteralPath $Template -Destination $target -Force

  $zip = [System.IO.Compression.ZipFile]::Open($target, [System.IO.Compression.ZipArchiveMode]::Update)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    $sr = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
    $xml = $sr.ReadToEnd()
    $sr.Close()

    $b = $xml.IndexOf("<w:body>") + "<w:body>".Length
    $e = $xml.LastIndexOf("<w:sectPr")
    if ($b -lt 8 -or $e -lt $b) { throw "bad body bounds" }

    $newXml = $xml.Substring(0, $b) + $body + $xml.Substring($e)

    $entry.Delete()
    $ne = $zip.CreateEntry("word/document.xml", [System.IO.Compression.CompressionLevel]::Optimal)
    $sw = New-Object System.IO.StreamWriter($ne.Open(), (New-Object System.Text.UTF8Encoding($false)))
    $sw.Write($newXml)
    $sw.Close()
  }
  finally {
    $zip.Dispose()
  }
  Write-Output ("OK " + $w.file)
}
