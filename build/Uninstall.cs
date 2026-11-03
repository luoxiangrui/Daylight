using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;
class Uninstall {
 [STAThread] static int Main(string[] args){
 bool test=args.Length==1&&args[0]=="--verify";string folder=AppDomain.CurrentDomain.BaseDirectory;
 try{
 if(!test&&MessageBox.Show("卸载 Daylight 0.3.0？个人资料和备份将保留。请先退出程序。","Daylight",MessageBoxButtons.OKCancel)!=DialogResult.OK)return 0;
 string manifest=Path.Combine(folder,"daylight-installed.txt");
 if(!File.Exists(manifest))throw new IOException("缺少安装清单。");
 foreach(string name in File.ReadAllLines(manifest)){string target=Path.GetFullPath(Path.Combine(folder,name));if(!target.StartsWith(folder,StringComparison.OrdinalIgnoreCase))throw new IOException("安装清单路径无效");if(!String.Equals(target,System.Reflection.Assembly.GetExecutingAssembly().Location,StringComparison.OrdinalIgnoreCase)&&File.Exists(target))File.Delete(target);}
 if(!test){dynamic shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));foreach(var location in new[]{Environment.SpecialFolder.Programs,Environment.SpecialFolder.DesktopDirectory}){string link=Path.Combine(Environment.GetFolderPath(location),"Daylight.lnk");if(File.Exists(link)&&String.Equals(shell.CreateShortcut(link).TargetPath,Path.Combine(folder,"Daylight.exe"),StringComparison.OrdinalIgnoreCase))File.Delete(link);}Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Daylight-0.3",false);}
 File.Delete(manifest);return 0;
 }catch(Exception e){if(!test)MessageBox.Show(e.Message,"卸载失败");return 1;}
 }
}
