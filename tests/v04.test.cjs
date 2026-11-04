const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite'),Store=require('../db/store.cjs');
function fixture(){const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'daylight-v4-')),'sample.sqlite'),db=new DatabaseSync(file);for(const name of ['001','002','003'])db.exec(fs.readFileSync(path.join(__dirname,'../db',name+'.sql'),'utf8'));return {db,file}}
test('v3 upgrade, actual amounts, correction, unit history, backup and cascade',()=>{
 const {db,file}=fixture();db.exec("INSERT INTO items(kind,title,date,data) VALUES('habit','阅读','2026-01-01','{}');INSERT INTO marks VALUES(1,'2026-01-02','1')");db.close();
 const s=new Store(file);assert.deepEqual(s.state().amounts,[]);assert.equal(s.state().marks[0].value,'1');
 const h={...s.state().items[0],measure:'数量',target:20,unit:'分钟'};s.save(h);
 const d='2026-11-04';s.amount(1,d,'add',12);assert.equal(s.state().amounts[0].amount,12);s.amount(1,d,'add',8);assert.equal(s.state().amounts[0].amount,20);s.amount(1,d,'set',0);assert.equal(s.state().amounts[0].amount,0);s.save({...h,target:10,unit:'页'});s.amount(1,d,'add',22);assert.equal(s.state().amounts[0].unit,'分钟');s.amount(1,'2026-11-05','add',13);assert.equal(s.state().amounts[1].unit,'页');
 assert.throws(()=>s.amount(1,d,'add',-1));const state=s.state();s.backup(file+'.bak');s.remove(1);assert.equal(s.state().amounts.length,0);s.close();const restored=new Store(file+'.bak');assert.deepEqual(restored.state(),state);restored.close()
});
test('migration failure rolls back version; future database rejected',()=>{
 const {file,db}=fixture();db.exec('CREATE TABLE habit_days(conflict TEXT)');db.close();assert.throws(()=>new Store(file));const check=new DatabaseSync(file);assert.equal(check.prepare('PRAGMA user_version').get().user_version,3);check.exec('PRAGMA user_version=5');check.close();assert.throws(()=>new Store(file),/版本较新/)
});
