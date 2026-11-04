param([string]$PreviousInstaller)
$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$electronDist=if(Test-Path 'node_modules/electron/dist'){Resolve-Path 'node_modules/electron/dist'}else{Resolve-Path '../eva-desktop/node_modules/electron/dist'}
$out=New-Item -Force -Type Directory release
$stage=New-Item -Type Directory (Join-Path ([IO.Path]::GetTempPath()) ('Daylight-'+[guid]::NewGuid()))
$runtime=New-Item -Type Directory (Join-Path $stage 'runtime')
Copy-Item "$electronDist/*" $runtime -Recurse
Rename-Item (Join-Path $runtime 'electron.exe') 'Daylight.exe'
$appDir=New-Item -Type Directory (Join-Path $runtime 'resources/app')
Copy-Item package.json,main.cjs,services.cjs,quick.cjs,quick-preload.cjs,preload.cjs,ui,db,tests $appDir -Recurse
Add-Type -AssemblyName System.IO.Compression.FileSystem
$compiler=Join-Path $env:windir 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $compiler /nologo /target:winexe /r:System.Windows.Forms.dll "/out:$runtime/Uninstall.exe" (Join-Path $PSScriptRoot 'Uninstall.cs')
if($LASTEXITCODE){throw 'Uninstaller compilation failed'}
$zip=Join-Path $stage 'payload.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($runtime,$zip,[IO.Compression.CompressionLevel]::Optimal,$false)
$compiler=Join-Path $env:windir 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$setup=Join-Path $out 'Daylight-0.4.0-Setup-x64.exe'
& $compiler /nologo /target:winexe /r:System.Windows.Forms.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "/resource:$zip,payload" "/out:$setup" (Join-Path $PSScriptRoot 'Setup.cs')
if($LASTEXITCODE){throw 'Installer compilation failed'}
$testDir=Join-Path $stage 'installed'
if($PreviousInstaller){
 $previous=Start-Process $PreviousInstaller -ArgumentList @('--verify',('"{0}"' -f $testDir)) -WindowStyle Hidden -Wait -PassThru
 if($previous.ExitCode -or !(Test-Path "$testDir/Daylight.exe")){throw 'Previous installer verification failed'}
 Write-Output 'Previous Windows build extracted for upgrade verification'
}
$p=Start-Process $setup -ArgumentList @('--verify',('"{0}"' -f $testDir)) -WindowStyle Hidden -Wait -PassThru
if($p.ExitCode -or !(Test-Path "$testDir/resources/app/main.cjs")){throw 'Installer extraction failed'}
$p=Start-Process "$testDir/Daylight.exe" -ArgumentList '--smoke' -WindowStyle Hidden -Wait -PassThru
if($p.ExitCode){throw "Desktop smoke failed: $($p.ExitCode)"}
$p=Start-Process "$testDir/Uninstall.exe" -ArgumentList '--verify' -WindowStyle Hidden -Wait -PassThru
if($p.ExitCode -or (Test-Path "$testDir/Daylight.exe")){throw 'Uninstall verification failed'}
$stream=[IO.File]::OpenRead($setup)
$algorithm=[Security.Cryptography.SHA256]::Create()
try{[BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-','') | Set-Content "$setup.sha256"}finally{$algorithm.Dispose();$stream.Dispose()}
Write-Output "Verified $setup"


