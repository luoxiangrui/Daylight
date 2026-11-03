const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
class Store {
 constructor(file){this.db=new DatabaseSync(file);this.db.exec('PRAGMA foreign_keys=ON');let version=this.db.prepare('PRAGMA user_version').get().user_version;if(version>2)throw Error('数据库版本较新');if(!version)this.db.exec('BEGIN;'+fs.readFileSync(path.join(__dirname,'001.sql'),'utf8')+'COMMIT');if(version<2)this.db.exec('BEGIN;'+fs.readFileSync(path.join(__dirname,'002.sql'),'utf8')+'COMMIT');}
 rows(sql,...p){return this.db.prepare(sql).all(...p)}
 run(sql,...p){return this.db.prepare(sql).run(...p)}
 state(){return {steps:this.rows('SELECT * FROM daily_steps'),editions:this.rows('SELECT * FROM editions ORDER BY day').map(r=>({...r,data:JSON.parse(r.data)})),draftFiles:this.rows('SELECT id,draft,name FROM draft_files'),nextTasks:this.rows('SELECT * FROM next_tasks'),items:this.rows('SELECT * FROM items').map(({data,...r})=>({...JSON.parse(data),...r})),marks:this.rows('SELECT * FROM marks'),files:this.rows('SELECT id,item,name FROM files'),notices:this.rows('SELECT * FROM notices ORDER BY stamp DESC'),history:this.rows('SELECT * FROM history'),prefs:Object.fromEntries(this.rows('SELECT * FROM prefs').map(r=>[r.key,JSON.parse(r.value)]))}}
 save({id,kind,title,date,goal,plan,task,...data}){title=title.trim();if(!title||!/^\d{4}-\d\d-\d\d$/.test(date))throw Error('请填写名称和日期');let args=[kind,title,date,+goal||null,+plan||null,+task||null,JSON.stringify(data)];this.db.exec('SAVEPOINT save_item');try{if(id)this.run('UPDATE items SET kind=?,title=?,date=?,goal=?,plan=?,task=?,data=? WHERE id=?',...args,id);else id=Number(this.run('INSERT INTO items(kind,title,date,goal,plan,task,data) VALUES(?,?,?,?,?,?,?)',...args).lastInsertRowid);if(kind==='goal')this.run('INSERT INTO history VALUES(?,?,?)',id,new Date().toISOString(),+data.progress||0);this.db.exec('RELEASE save_item');return id}catch(e){this.db.exec('ROLLBACK TO save_item; RELEASE save_item');throw e}}
 pref(k,v){this.run('INSERT OR REPLACE INTO prefs VALUES(?,?)',k,JSON.stringify(v))}
 mark(id,day,value){this.run('INSERT OR REPLACE INTO marks VALUES(?,?,?)',id,day,value)}
 remove(id){this.run('DELETE FROM items WHERE id=?',id)}
 backup(file){this.run('VACUUM INTO ?',file)}
 close(){this.db.close()}
}
Object.assign(Store.prototype,require('./notebook.cjs'));module.exports=Store;
