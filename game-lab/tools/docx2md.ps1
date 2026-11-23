# Converts a docx to markdown. Cyrillic comes from the document, so this script stays ASCII.
param(
  [Parameter(Mandatory=$true)][string]$Src,
  [Parameter(Mandatory=$true)][string]$Out
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($Src)
try {
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
  $sr = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
  $xmlText = $sr.ReadToEnd()
  $sr.Close()
}
finally { $zip.Dispose() }

[xml]$doc = $xmlText
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paras = $doc.SelectNodes('//w:p', $ns)
$lines = New-Object System.Collections.Generic.List[string]
$first = $true

foreach ($p in $paras) {
  $isListPara = $p.SelectSingleNode('.//w:numPr', $ns) -ne $null

  # один абзац может содержать несколько строк через <w:br/>
  $segments = New-Object System.Collections.Generic.List[object]
  $sb = New-Object System.Text.StringBuilder
  $segAllBold = $true
  $segHasText = $false

  function Close-Segment {
    param($sb, $allBold, $hasText, $segments)
    if ($hasText -and $sb.Length -gt 0) {
      $segments.Add([pscustomobject]@{ Text = $sb.ToString().Trim(); AllBold = $allBold }) | Out-Null
    }
  }

  foreach ($r in $p.SelectNodes('.//w:r', $ns)) {
    $boldNode = $r.SelectSingleNode('w:rPr/w:b', $ns)
    $isBoldRun = $boldNode -ne $null
    foreach ($child in $r.ChildNodes) {
      if ($child.LocalName -eq 'br') {
        if ($segHasText -and $sb.Length -gt 0) {
          $segments.Add([pscustomobject]@{ Text = $sb.ToString().Trim(); AllBold = $segAllBold }) | Out-Null
        }
        [void]$sb.Clear()
        $segAllBold = $true
        $segHasText = $false
        continue
      }
      if ($child.LocalName -ne 't') { continue }
      $txt = $child.InnerText
      if ([string]::IsNullOrEmpty($txt)) { continue }
      $segHasText = $true
      if ($isBoldRun) { [void]$sb.Append('**').Append($txt).Append('**') }
      else {
        $segAllBold = $false
        [void]$sb.Append($txt)
      }
    }
  }
  if ($segHasText -and $sb.Length -gt 0) {
    $segments.Add([pscustomobject]@{ Text = $sb.ToString().Trim(); AllBold = $segAllBold }) | Out-Null
  }

  foreach ($seg in $segments) {
    $text = $seg.Text.Trim()
    if ($text -eq '') { continue }
    $plain = $text -replace '\*\*', ''

    if ($first) {
      $lines.Add('# ' + $plain)
      $first = $false
      continue
    }

    # маркер списка в исходнике — тире в начале строки
    if ($plain.StartsWith([char]0x2013) -or $plain.StartsWith([char]0x2014) -or $plain.StartsWith('- ')) {
      $body = $text -replace '^(\*\*)?[\u2013\u2014]\s*', '$1' -replace '^-\s+', ''
      $lines.Add('- ' + $body)
      continue
    }

    $isHeading = $seg.AllBold -and $plain.Length -le 90 -and -not $plain.EndsWith('.') -and -not $isListPara
    if ($isHeading) { $lines.Add('## ' + $plain) }
    elseif ($isListPara) { $lines.Add('- ' + $text) }
    else { $lines.Add($text) }
  }
}

$result = ($lines -join "`r`n") + "`r`n"
[System.IO.File]::WriteAllText($Out, $result, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("OK " + (Split-Path $Out -Leaf) + " (" + $lines.Count + " lines)")
