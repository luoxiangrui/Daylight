const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite'),{Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const promises=fs.promises;
function inspect(file){
 const db=new DatabaseSync(file,{readOnly:true});try{
 const version=db.prepare('PRAGMA user_version').get().user_version;if(![1,2,3,4].includes(version))throw Error('备份版本不支持');
 if(db.prepare('PRAGMA integrity_check').all().some(r=>r.integrity_check!=='ok'))throw Error('SQLite 完整性检查失败');
 let tables=['items','prefs','marks','files','notices','history'];if(version>=2)tables.push('editions','next_tasks','daily_steps','draft_files');if(version>=3)tables.push('tags','item_tags','goal_events','completions','quick_receipts');if(version>=4)tables.push('habit_days');for(const t of tables)db.prepare('SELECT * FROM '+t+' LIMIT 0').all();
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('有孤立的关联记录');
 if(db.prepare("SELECT 1 FROM files WHERE item IS NULL OR name IS NULL OR typeof(bytes)!='blob' LIMIT 1").get())throw Error('附件关联或内容无效');
 if(db.prepare("SELECT 1 FROM items WHERE NOT json_valid(data) OR json_type(data)!='object' LIMIT 1").get())throw Error('记录数据结构损坏');
 if(db.prepare("SELECT 1 FROM prefs WHERE NOT json_valid(value) LIMIT 1").get())throw Error('偏好数据损坏');
 if(version>=2&&db.prepare("SELECT 1 FROM draft_files f WHERE typeof(bytes)!='blob' OR (draft!='draftnew' AND NOT EXISTS(SELECT 1 FROM items i WHERE i.kind='journal' AND 'draft'||i.id=f.draft)) LIMIT 1").get())throw Error('草稿附件来源不完整');
 const counts=db.prepare("SELECT count(*) total,count(CASE WHEN kind='task' THEN 1 END) tasks,count(CASE WHEN kind='journal' THEN 1 END) journals,count(CASE WHEN kind='goal' THEN 1 END) goals FROM items").get();
 return {...counts,version,files:db.prepare('SELECT count(*) n FROM files').get().n,date:fs.statSync(file).mtime.toISOString()}
 }finally{db.close()}}
function snapshot(src,dest){let db=new DatabaseSync(src,{readOnly:true});try{db.prepare('VACUUM INTO ?').run(dest)}finally{db.close()}}
function job(action,...args){return new Promise((resolve,reject)=>{const worker=new Worker(__filename,{workerData:{action,args}});worker.once('message',m=>m.error?reject(Error(m.error)):resolve(m.value));worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('备份工作进程中断'))})})}
if(!isMainThread&&workerData?.action){try{parentPort.postMessage({value:({snapshot,inspect})[workerData.action](...workerData.args)})}catch(e){parentPort.postMessage({error:e.message})}}
async function backup(src,dest){if(path.resolve(src).toLowerCase()===path.resolve(dest).toLowerCase())throw Error('请勿覆盖正在使用的数据库');let temp=dest+'.'+crypto.randomUUID()+'.partial';try{await job('snapshot',src,temp);await job('inspect',temp);await promises.rename(temp,dest)}finally{await promises.rm(temp,{force:true})}}
async function automatic(src,dir,keep){if(!Number.isInteger(keep)||keep<1||keep>100)throw Error('保留数量应在 1 至 100 之间');const folder=path.join(dir,'Daylight-auto');await promises.mkdir(folder,{recursive:true});const name='daylight-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite';await backup(src,path.join(folder,name));const list=(await promises.readdir(folder)).filter(n=>/^daylight-\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z\.sqlite$/.test(n)).sort().reverse();for(const n of list.slice(keep))await promises.unlink(path.join(folder,n));return path.join(folder,name)}
function replaceStore(ctx,filename,tmp,open=f=>new (require('./store.cjs'))(f)){
 const old=filename+'.'+crypto.randomUUID()+'.bak';ctx.get().backup(old);ctx.get().close();let replaced=false;
 try{fs.renameSync(tmp,filename);replaced=true;ctx.set(open(filename));return old}
 catch(err){if(replaced)fs.copyFileSync(old,filename);ctx.set(new (require('./store.cjs'))(filename));throw err}
}
module.exports={replaceStore,job,backup,automatic,inspect,snapshot};
