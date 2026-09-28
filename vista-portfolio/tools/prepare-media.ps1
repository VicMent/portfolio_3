# Re-encodes the heavy source media into web-friendly files under public/media.
# Idempotent — safe to re-run. Source assets are left untouched.

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
# Source media lives outside public/ so only the optimised copies get shipped.
$frames = Join-Path (Split-Path -Parent $root) 'animation_backup'
$source = Join-Path (Split-Path -Parent $root) '_source-media'
$pub   = Join-Path $root 'public'
$out   = Join-Path $pub 'media'

if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }
if (-not (Test-Path $source)) { New-Item -ItemType Directory -Path $source | Out-Null }

function Run($label, $exeArgs) {
    Write-Host "  -> $label"
    # ffmpeg is chatty on stderr; swallow it and judge success by the exit code.
    & ffmpeg @exeArgs *> $null
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $label (exit $LASTEXITCODE)" }
}

Write-Host "Screensaver turntable (slow spin from the 170 source frames)"
Run 'turntable.webm (VP9)' @(
    '-y','-framerate','12','-start_number','1','-i',(Join-Path $frames '%04d.png'),
    '-vf','scale=1280:-2','-c:v','libvpx-vp9','-crf','36','-b:v','0','-row-mt','1',
    '-pix_fmt','yuv420p','-an',(Join-Path $out 'turntable.webm')
)
Run 'turntable.mp4 (H.264, Safari fallback)' @(
    '-y','-framerate','12','-start_number','1','-i',(Join-Path $frames '%04d.png'),
    '-vf','scale=1280:-2','-c:v','libx264','-crf','27','-preset','slow',
    '-pix_fmt','yuv420p','-an','-movflags','+faststart',(Join-Path $out 'turntable.mp4')
)
Run 'turntable-poster.jpg' @(
    '-y','-i',(Join-Path $frames '0085.png'),'-vf','scale=1280:-2','-q:v','5',
    (Join-Path $out 'turntable-poster.jpg')
)

# name, source, width, crf
$jobs = @(
    @{ n='unity';  src='unity_project.mp4'; w=1280; crf=29; at='00:00:03' },
    @{ n='roid3';  src='RoidRager3.mp4';    w=960;  crf=29; at='00:00:02' },
    @{ n='roid4';  src='RoidRager4.mp4';    w=960;  crf=29; at='00:00:02' },
    @{ n='website';src='website.mp4';        w=960;  crf=29; at='00:00:02' }
)

Write-Host "Content videos"
foreach ($j in $jobs) {
    $src = Join-Path $source $j.src
    if (-not (Test-Path $src)) { Write-Host "  !! missing $($j.src) in _source-media, skipping"; continue }
    Run "$($j.n).mp4" @(
        '-y','-i',$src,'-vf',"scale=$($j.w):-2",'-c:v','libx264','-crf',"$($j.crf)",
        '-preset','slow','-pix_fmt','yuv420p','-movflags','+faststart','-an',
        (Join-Path $out "$($j.n).mp4")
    )
}

Write-Host "Poster frames"
foreach ($j in $jobs) {
    $src = Join-Path $source $j.src
    if (-not (Test-Path $src)) { continue }
    Run "$($j.n)-poster.jpg" @(
        '-y','-ss',$j.at,'-i',$src,'-frames:v','1','-vf',"scale=$($j.w):-2",'-q:v','5',
        (Join-Path $out "$($j.n)-poster.jpg")
    )
}

Write-Host "`nResults:"
Get-ChildItem $out | Sort-Object Name | ForEach-Object {
    '{0,-24} {1,8:N0} KB' -f $_.Name, ($_.Length / 1KB)
}
