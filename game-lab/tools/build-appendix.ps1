# Builds an appendix for "Ход игроков.docx" from appendix.json and writes a new docx.
# ASCII only: all Russian text comes from the UTF-8 JSON file.
param(
  [string]$Src = "C:\Users\InsaneHoo8\Desktop\Лайтовая настолка\Игровой процесс\Ход игроков.docx",
  [string]$Json = "game-lab\rules\appendix.json",
  [string]$Out = "game-lab\rules\hod-igrokov-new.docx"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

function Esc([string]$s) {
  if ($null -eq $s) { return "" }
  return [System.Security.SecurityElement]::Escape($s)
}

$blocks = (Get-Content -LiteralPath $Json -Raw -Encoding UTF8) | ConvertFrom-Json

$sb = New-Object System.Text.StringBuilder

function Add-Para([string]$inner, [string]$extraPPr) {
  [void]$sb.Append("<w:p>")
  if ($extraPPr) { [void]$sb.Append("<w:pPr>").Append($extraPPr).Append("</w:pPr>") }
  [void]$sb.Append($inner).Append("</w:p>")
}

foreach ($b in $blocks) {
  $kind = [string]$b.kind
  if ($kind -eq "h") {
    $runs = "<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space=""preserve"">" + (Esc $b.text) + "</w:t></w:r>"
    Add-Para $runs '<w:spacing w:before="320" w:after="120"/>'
  }
  elseif ($kind -eq "b") {
    $runs = ""
    if ($b.bold) {
      $runs += "<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space=""preserve"">" + (Esc $b.bold) + "</w:t></w:r>"
    }
    $runs += "<w:r><w:t xml:space=""preserve"">" + (Esc $b.text) + "</w:t></w:r>"
    Add-Para $runs '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>'
  }
  else {
    $runs = "<w:r><w:t xml:space=""preserve"">" + (Esc $b.text) + "</w:t></w:r>"
    Add-Para $runs '<w:spacing w:before="0" w:after="120"/>'
  }
}

$appendix = $sb.ToString()

$work = $Out
Copy-Item -LiteralPath $Src -Destination $work -Force

$zip = [System.IO.Compression.ZipFile]::Open($work, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
  if (-not $entry) { throw "no word/document.xml" }
  $sr = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
  $xml = $sr.ReadToEnd()
  $sr.Close()

  $anchor = $xml.LastIndexOf("<w:sectPr")
  if ($anchor -lt 0) { $anchor = $xml.LastIndexOf("</w:body>") }
  if ($anchor -lt 0) { throw "no insertion point" }

  $newXml = $xml.Substring(0, $anchor) + $appendix + $xml.Substring($anchor)

  $entry.Delete()
  $newEntry = $zip.CreateEntry("word/document.xml", [System.IO.Compression.CompressionLevel]::Optimal)
  $sw = New-Object System.IO.StreamWriter($newEntry.Open(), (New-Object System.Text.UTF8Encoding($false)))
  $sw.Write($newXml)
  $sw.Close()
}
finally {
  $zip.Dispose()
}

Write-Output ("written: " + (Resolve-Path $work).Path)
Write-Output ("bytes: " + (Get-Item $work).Length)
