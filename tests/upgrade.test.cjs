const test=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),fs=require('fs'),path=require('path'),os=require('os'),Store=require('../db/store.cjs');
test('v1 rows and attachment bytes survive migration, independent daily checks, restart and full backup',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'daylight-upgrade-')),file=path.join(root,'old.sqlite'),bak=path.join(root,'backup.sqlite'),old=new DatabaseSync(file);
 old.exec(fs.readFileSync(path.join(__dirname,'../db/001.sql'),'utf8'));
 let insert=old.prepare('INSERT INTO items(kind,title,date,goal,data) VALUES(?,?,?,?,?)');
 insert.run('goal','阅读','2026-11-01',null,'{}');insert.run('task','睡前整理','2026-11-01',1,JSON.stringify({repeat:'每天',subtasks:'收拾书桌\n整理书包',checkedSteps:['收拾书桌']}));insert.run('journal','生活记录','2026-11-01',null,'{"notes":"晚饭后散步"}');insert.run('habit','散步','2026-11-01',null,'{}');old.prepare('INSERT INTO files(item,name,bytes) VALUES(?,?,?)').run(3,'附件',Buffer.from('旧附件'));old.exec("INSERT INTO marks VALUES(4,'2026-11-01','1'); INSERT INTO prefs VALUES('draftnew','{\"notes\":\"旧草稿\"}')");
 const baseline=db=>Object.fromEntries(['items','files','marks','prefs','history','notices'].map(t=>[t,db.prepare('SELECT * FROM '+t).all()]));
 const prior=baseline(old);old.close();let db=new Store(file);assert.deepEqual(baseline(db.db),prior);assert.equal(db.state().steps.length,0);
 db.toggleStep(2,'2026-11-02','收拾书桌');db.edition(2,'2026-11-03','day',{title:'周二整理'});db.edition(2,'2026-11-04','future',{title:'整理十分钟'});db.stage('draftnew','草稿附件',Buffer.from('新附件'));db.pref('draftnew',{notes:'继续写'});db.close();db=new Store(file);assert.equal(db.state().prefs.draftnew.notes,'继续写');assert.equal(db.state().draftFiles.length,1);assert.throws(()=>db.publish({kind:'journal',title:'',date:'2026-11-03'},'draftnew'));assert.equal(db.state().draftFiles.length,1);
 let j=db.publish({kind:'journal',title:'新日记',date:'2026-11-03'},'draftnew');assert.equal(db.state().files.filter(f=>f.item===j).length,1);assert.equal(db.state().draftFiles.length,0);
 assert.equal(db.nextTask('2026-11-02','走一走','2026-11-10'),db.nextTask('2026-11-02','走一走','2026-11-10'));
 db.backup(bak);let after=db.state();db.close();let restored=new Store(bak);assert.deepEqual(restored.state(),after);assert.equal(restored.db.prepare('PRAGMA foreign_key_check').all().length,0);assert.equal(Buffer.from(restored.rows('SELECT bytes FROM files WHERE item=?',j)[0].bytes).toString(),'新附件');restored.close()
});
