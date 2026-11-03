const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {dialog,nativeImage}=require('electron'),Store=require('./db/store.cjs'),M=require('./db/maintenance.cjs'),V=require('./db/validation.cjs'),{exportFolder}=require('./db/export.cjs'),D=require('./ui/dates');
module.exports=function services(ctx){
 const {win,filename,qa}=ctx;const store=()=>ctx.get();let busy=false,autoRunning=false;
 async function directory(){let d=await dialog.showOpenDialog(win(),{properties:['openDirectory','createDirectory']});return d.canceled?null:d.filePaths[0]}
 const prefs=()=>Object.fromEntries(store().rows("SELECT key,value FROM prefs WHERE key LIKE 'auto.%'").map(r=>[r.key.slice(5),JSON.parse(r.value)]));
 async function runAuto(force=false){let p=prefs();if(autoRunning||busy)return;if(!p.dir||p.frequency==='关闭'||!p.frequency){if(force)throw Error('请先选择备份目录并保存每日或每周频率');return}let today=D.today(),elapsed=p.last?D.diff(today,p.last):Infinity;if(!force&&elapsed<(p.frequency==='每周'?7:1))return;autoRunning=true;try{const file=await M.automatic(filename,p.dir,+p.keep||7);store().pref('auto.last',today);store().pref('auto.status','已备份到 '+file)}catch(e){store().pref('auto.status','备份失败：'+e.message);if(force)throw e}finally{autoRunning=false}}
 async function exportAll(only){let dir=await directory();if(!dir)return false;let tmp=path.join(require('node:os').tmpdir(),'daylight-export-'+crypto.randomUUID()+'.sqlite'),snap;try{await M.backup(filename,tmp);snap=new Store(tmp);return await exportFolder(snap,dir,only)}finally{snap?.close();await fs.promises.rm(tmp,{force:true})}}
 return {runAuto,actions:{
 tags:o=>store().changeTag(o),
 exportBook:()=>exportAll(false),exportFiles:()=>exportAll(true),
 autoDirectory:async()=>{let dir=await directory();if(dir)store().pref('auto.dir',dir);return dir},
 autoConfig:(frequency,keep)=>{if(!['关闭','每日','每周'].includes(frequency)||!Number.isInteger(keep)||keep<1||keep>100)throw Error('备份设置无效');store().atomic(()=>{store().pref('auto.frequency',frequency);store().pref('auto.keep',keep)})},
 autoNow:()=>runAuto(true),
 backup:async()=>{let d=await dialog.showSaveDialog(win(),{defaultPath:'Daylight-'+D.today()+'.sqlite'});if(d.canceled)return false;await M.backup(filename,d.filePath);return true},
 restore:async()=>{if(busy||autoRunning)throw Error('另一个数据操作正在运行');busy=true;let tmp=filename+'.restore-'+crypto.randomUUID();try{let d=await dialog.showOpenDialog(win(),{properties:['openFile'],filters:[{name:'Daylight',extensions:['sqlite']}]});if(d.canceled)return false;let report=await M.job('inspect',d.filePaths[0]);await M.backup(d.filePaths[0],tmp);let probe=new Store(tmp);try{probe.state()}finally{probe.close()}
 let msg='备份文件时间 '+new Date(report.date).toLocaleString()+'，数据库版本 '+report.version+'。共 '+report.total+' 条记录，其中日记 '+report.journals+'、任务 '+report.tasks+'、目标 '+report.goals+'，附件 '+report.files+' 个。';
 if(!qa&&(await dialog.showMessageBox(win(),{type:'question',message:'用这份备份恢复？',detail:msg,buttons:['取消','恢复'],defaultId:0,cancelId:0})).response!==1)return false;
 let old=M.replaceStore(ctx,filename,tmp);return '已恢复 '+report.total+' 条记录。原库副本：'+old
 }finally{busy=false;await fs.promises.rm(tmp,{force:true})}},
 attach:async id=>{V.id(id);let f=await dialog.showOpenDialog(win(),{properties:['openFile','multiSelections']});for(const p of f.filePaths){if((await fs.promises.stat(p)).size>V.limit)throw Error('附件超过 32 MB');let b=await fs.promises.readFile(p);store().run('INSERT INTO files(item,name,bytes) VALUES(?,?,?)',id,path.basename(p),V.attachment(path.basename(p),b))}return !f.canceled},
 photo:(id,draft=false)=>{let [f]=store().rows('SELECT name,bytes FROM '+(draft?'draft_files':'files')+' WHERE id=?',V.id(id));if(!f)return null;let ext=path.extname(f.name).slice(1).toLowerCase();if(!['png','jpg','jpeg','gif','webp'].includes(ext))return null;const b=Buffer.from(f.bytes);try{V.attachment(f.name,b)}catch{return null}return 'data:image/'+(ext==='jpg'?'jpeg':ext)+';base64,'+b.toString('base64')},
 }};
};
