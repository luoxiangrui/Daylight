$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$electronDist=if(Test-Path 'node_modules/electron/dist'){Resolve-Path 'node_modules/electron/dist'}else{Resolve-Path '../eva-desktop/node_modules/electron/dist'}
$out=New-Item -Force -Type Directory release
$stage=New-Item -Type Directory (Join-Path ([IO.Path]::GetTempPath()) ('Daylight-'+[guid]::NewGuid()))
$runtime=New-Item -Type Directory (Join-Path $stage 'runtime')
Copy-Item "$electronDist/*" $runtime -Recurse
Rename-Item (Join-Path $runtime 'electron.exe') 'Daylight.exe'
$appDir=New-Item -Type Directory (Join-Path $runtime 'resources/app')
Copy-Item package.json,main.cjs,preload.cjs,ui,db,tests $appDir -Recurse
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=Join-Path $stage 'payload.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($runtime,$zip,[IO.Compression.CompressionLevel]::Optimal,$false)
$compiler=Join-Path $env:windir 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$setup=Join-Path $out 'Daylight-Setup-x64.exe'
& $compiler /nologo /target:winexe /r:System.Windows.Forms.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "/resource:$zip,payload" "/out:$setup" (Join-Path $PSScriptRoot 'Setup.cs')
if($LASTEXITCODE){throw 'Installer compilation failed'}
$testDir=Join-Path $stage 'installed'
$p=Start-Process $setup -ArgumentList @('--verify',('"{0}"' -f $testDir)) -WindowStyle Hidden -Wait -PassThru
if($p.ExitCode -or !(Test-Path "$testDir/resources/app/main.cjs")){throw 'Installer extraction failed'}
$p=Start-Process "$testDir/Daylight.exe" -ArgumentList '--smoke' -WindowStyle Hidden -Wait -PassThru
if($p.ExitCode){throw "Desktop smoke failed: $($p.ExitCode)"}
Write-Output "Verified $setup"


