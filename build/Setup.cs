using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Windows.Forms;
class Setup {
 [STAThread] static int Main(string[] args){
 bool test=args.Length==2 && args[0]=="--verify";
 string folder=test?Path.GetFullPath(args[1]):Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","Daylight");
 try{
 if(!test && MessageBox.Show("安装 Daylight 0.4.0 Windows x64 到 "+folder+"？","Daylight 安装",MessageBoxButtons.OKCancel)!=DialogResult.OK)return 0;
 Directory.CreateDirectory(folder);var names=new System.Collections.Generic.List<string>();
 using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("payload"))
 using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
 foreach(var entry in zip.Entries){string target=Path.GetFullPath(Path.Combine(folder,entry.FullName));if(!target.StartsWith(folder+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("Invalid path");Directory.CreateDirectory(Path.GetDirectoryName(target));if(entry.Name.Length>0){entry.ExtractToFile(target,true);names.Add(entry.FullName);}}
 }
 File.WriteAllLines(Path.Combine(folder,"daylight-installed.txt"),names.ToArray());
 if(!test){using(var key=Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Daylight-0.3")){key.SetValue("DisplayName","Daylight");key.SetValue("DisplayVersion","0.4.0");key.SetValue("UninstallString","\""+Path.Combine(folder,"Uninstall.exe")+"\"");}dynamic shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));dynamic link=shell.CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Daylight.lnk"));link.TargetPath=Path.Combine(folder,"Daylight.exe");link.WorkingDirectory=folder;link.Save();if(MessageBox.Show("创建桌面快捷方式？","Daylight",MessageBoxButtons.YesNo)==DialogResult.Yes){dynamic desktop=shell.CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),"Daylight.lnk"));desktop.TargetPath=link.TargetPath;desktop.WorkingDirectory=folder;desktop.Save();}Process.Start(link.TargetPath);}
 return 0;
 }catch(Exception e){if(!test)MessageBox.Show(e.Message,"Daylight 安装失败");return 1;}
 }
}
