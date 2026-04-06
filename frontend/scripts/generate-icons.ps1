Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Ihya\.gemini\antigravity\brain\34fcd5e4-818b-4a40-bb7b-42c482c0c83c\media__1774371316093.png"
$outDir = "d:\BACKUP\keuanganKeluarga\frontend\public"

foreach ($size in @(192, 512)) {
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $outPath = "$outDir\pwa-${size}x${size}.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Saved $outPath"
}
Write-Host "Done!"
