# Builds a standalone docx from a JSON block list, using an existing docx as style template.
# ASCII only: all Russian text comes from the JSON.
param(
  [Parameter(Mandatory=$true)][string]$Json,
  [Parameter(Mandatory=$true)][string]$Template,
  [Parameter(Mandatory=$true)][string]$Out
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/>'

function Esc([string]$s) {
  if ($null -eq $s) { return "" }
  return [System.Security.SecurityElement]::Escape($s)
}

$cfg = (Get-Content -LiteralPath $Json -Raw -Encoding UTF8) | ConvertFrom-Json
$sb = New-Object System.Text.StringBuilder

function Add-Para([string]$inner, [string]$extraPPr) {
  [void]$sb.Append("<w:p>")
  if ($extraPPr) { [void]$sb.Append("<w:pPr>").Append($extraPPr).Append("</w:pPr>") }
  [void]$sb.Append($inner).Append("</w:p>")
}

function RunsXml($runs) {
  $out = ""
  foreach ($r in $runs) {
    $txt = Esc $r.text
    if ($txt -eq "") { continue }
    if ($r.bold) { $out += '<w:r><w:rPr>' + $FONT + '<w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">' + $txt + '</w:t></w:r>' }
    else { $out += '<w:r><w:rPr>' + $FONT + '</w:rPr><w:t xml:space="preserve">' + $txt + '</w:t></w:r>' }
  }
  return $out
}

# Title paragraph
$titleRuns = RunsXml @([pscustomobject]@{ text = [string]$cfg.title; bold = $true })
Add-Para $titleRuns '<w:spacing w:after="160"/>'

foreach ($b in $cfg.blocks) {
  $kind = [string]$b.kind
  if ($kind -eq "h") {
    Add-Para (RunsXml @([pscustomobject]@{ text = [string]$b.text; bold = $true })) '<w:spacing w:before="320" w:after="120"/>'
  }
  elseif ($kind -eq "b") {
    $runs = ""
    if ($b.runs) { $runs = RunsXml $b.runs }
    else {
      $parts = @()
      if ($b.bold) { $parts += [pscustomobject]@{ text = [string]$b.bold; bold = $true } }
      $parts += [pscustomobject]@{ text = [string]$b.text; bold = $false }
      $runs = RunsXml $parts
    }
    Add-Para $runs '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
  }
  else {
    if ($b.runs) { $runs = RunsXml $b.runs }
    else { $runs = RunsXml @([pscustomobject]@{ text = [string]$b.text; bold = $false }) }
    Add-Para $runs '<w:spacing w:before="0" w:after="120"/>'
  }
}

$body = $sb.ToString()

if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
Copy-Item -LiteralPath $Template -Destination $Out -Force

$zip = [System.IO.Compression.ZipFile]::Open($Out, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  # 1. document.xml
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

  # 2. styles.xml: default font of the document
  $styleEntry = $zip.Entries | Where-Object { $_.FullName -eq "word/styles.xml" }
  if ($styleEntry -ne $null) {
    $sr2 = New-Object System.IO.StreamReader($styleEntry.Open(), [System.Text.Encoding]::UTF8)
    $styles = $sr2.ReadToEnd()
    $sr2.Close()

    $fontXml = '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
    $styles = [regex]::Replace($styles, '<w:rFonts[^/]*/>', $fontXml)

    if ($styles -match '<w:docDefaults>') {
      if ($styles -notmatch '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts') {
        $styles = $styles.Replace('<w:docDefaults>', '<w:docDefaults><w:rPrDefault><w:rPr>' + $fontXml + '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault>')
      }
    }

    $styleEntry.Delete()
    $se = $zip.CreateEntry("word/styles.xml", [System.IO.Compression.CompressionLevel]::Optimal)
    $sw2 = New-Object System.IO.StreamWriter($se.Open(), (New-Object System.Text.UTF8Encoding($false)))
    $sw2.Write($styles)
    $sw2.Close()
  }
}
finally {
  $zip.Dispose()
}
Write-Output ("OK " + $Out)
