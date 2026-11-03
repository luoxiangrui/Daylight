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
 if(!test && MessageBox.Show("安装 Daylight 到 "+folder+"？","Daylight 安装",MessageBoxButtons.OKCancel)!=DialogResult.OK)return 0;
 Directory.CreateDirectory(folder);
 using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("payload"))
 using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
 foreach(var entry in zip.Entries){string target=Path.GetFullPath(Path.Combine(folder,entry.FullName));if(!target.StartsWith(folder+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("Invalid path");Directory.CreateDirectory(Path.GetDirectoryName(target));if(entry.Name.Length>0)entry.ExtractToFile(target,true);}
 }
 if(!test){dynamic shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));dynamic link=shell.CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Daylight.lnk"));link.TargetPath=Path.Combine(folder,"Daylight.exe");link.WorkingDirectory=folder;link.Save();Process.Start(link.TargetPath);}
 return 0;
 }catch(Exception e){if(!test)MessageBox.Show(e.Message,"Daylight 安装失败");return 1;}
 }
}
