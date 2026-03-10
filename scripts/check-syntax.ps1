$content = Get-Content 'c:\Source\TrafficInfo\scripts\provision-columns.ps1' -Raw
$errors = $null
$tokens = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$errors)
if ($errors.Count -gt 0) {
    Write-Host "Found $($errors.Count) parse errors:"
    foreach ($e in $errors) {
        Write-Host "  Line $($e.Token.StartLine), Col $($e.Token.StartColumn): $($e.Message)"
    }
} else {
    Write-Host "No parse errors found - $($tokens.Count) tokens parsed successfully"
}
