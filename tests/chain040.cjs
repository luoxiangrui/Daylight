const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
const Store=require('../db/store.cjs'),M=require('../db/maintenance.cjs'),{exportFolder}=require('../db/export.cjs');
async function audit(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'daylight-chain-')),file=path.join(root,'daylight.sqlite'),old=new DatabaseSync(file),d='2026-11-04';
 for(const n of ['001','002','003'])old.exec(fs.readFileSync(path.join(__dirname,'../db',n+'.sql'),'utf8'));
 const kinds='goal plan task log milestone event achievement moment habit journal'.split(' ');
 for(const k of kinds)old.prepare('INSERT INTO items(kind,title,date,goal,plan,data) VALUES(?,?,?,?,?,?)').run(k,'样本'+k,d,k==='task'?1:null,k==='log'?2:null,JSON.stringify(k==='task'?{repeat:'每天',subtasks:'收拾书桌'}:{}));
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+9sAAAAASUVORK5CYII=','base64');
 old.prepare('INSERT INTO files(item,name,bytes) VALUES(10,?,?)').run('照片.png',image);old.prepare('INSERT INTO draft_files(draft,name,bytes) VALUES(?,?,?)').run('draftnew','草稿.png',image);
 old.exec("INSERT INTO marks VALUES(9,'2026-11-04','1');INSERT INTO notices VALUES(3,'2026-11-04');INSERT INTO daily_steps VALUES(3,'2026-11-04','收拾书桌');INSERT INTO next_tasks VALUES('2026-11-02',3)");
 for(const [k,v] of Object.entries({draftnew:{notes:'草稿'},cards:['week','task'],'week:2026-11-02':{photos:[1],pick:'10|'+d},appearance:'深色'}))old.prepare('INSERT INTO prefs VALUES(?,?)').run(k,JSON.stringify(v));
 const tables=old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
 function manifest(db){return Object.fromEntries(tables.map(t=>[t,db.prepare('SELECT * FROM '+t).all().map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,k==='bytes'?crypto.createHash('sha256').update(v).digest('hex'):v])))]))}
 const baseline=manifest(old);old.close();let s=new Store(file);assert.deepEqual(manifest(s.db),baseline);
 s.save({...s.state().items.find(r=>r.kind==='journal'),notes:'散步回来。'});s.close();s=new Store(file);const edited=manifest(s.db),bak=file+'.snapshot';await M.backup(file,bak);s.remove(10);assert.equal(s.state().files.length,0);
 const preview=M.inspect(bak);assert.equal(preview.total,10);assert.equal(preview.files,1);const incoming=file+'.restore';await M.backup(bak,incoming);const previous=M.replaceStore({get:()=>s,set:x=>s=x},file,incoming);assert(fs.existsSync(previous));assert.deepEqual(manifest(s.db),edited);
 const exported=await exportFolder(s,root),moved=path.join(root,'移动后的手记');fs.renameSync(exported,moved);const md=fs.readFileSync(path.join(moved,d+'-10.md'),'utf8');assert(md.includes('散步回来'));const url=md.match(/!\[.*?\]\((.*?)\)/)[1];assert.deepEqual(fs.readFileSync(path.join(moved,decodeURIComponent(url))),image);s.close();
 console.log(JSON.stringify({kinds,preview,previous,baseline,exported:moved},null,2))
}
audit().catch(e=>{console.error(e);process.exitCode=1});
