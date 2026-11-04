const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
const V=require('./validation.cjs');
class Store {
 constructor(file){this.db=new DatabaseSync(file);this.db.exec('PRAGMA foreign_keys=ON');let version=this.db.prepare('PRAGMA user_version').get().user_version;if(version>4)throw Error('数据库版本较新');if(!version)this.db.exec('BEGIN;'+fs.readFileSync(path.join(__dirname,'001.sql'),'utf8')+'COMMIT');if(version<2)this.db.exec('BEGIN;'+fs.readFileSync(path.join(__dirname,'002.sql'),'utf8')+'COMMIT');if(version<3)this.atomic(()=>{this.db.exec(fs.readFileSync(path.join(__dirname,'003.sql'),'utf8'));for(const r of this.rows('SELECT id,data FROM items'))this.syncTags(r.id,JSON.parse(r.data).tags)});if(version<4)this.atomic(()=>this.db.exec(fs.readFileSync(path.join(__dirname,'004.sql'),'utf8')));}
 rows(sql,...p){return this.db.prepare(sql).all(...p)}
 run(sql,...p){return this.db.prepare(sql).run(...p)}
 state(){return {amounts:this.rows("SELECT * FROM habit_days"),tags:this.rows('SELECT * FROM tags ORDER BY name'),tagLinks:this.rows('SELECT * FROM item_tags'),completions:this.rows('SELECT * FROM completions'),steps:this.rows('SELECT * FROM daily_steps'),editions:this.rows('SELECT * FROM editions ORDER BY day').map(r=>({...r,data:JSON.parse(r.data)})),draftFiles:this.rows('SELECT id,draft,name FROM draft_files'),nextTasks:this.rows('SELECT * FROM next_tasks'),items:this.rows('SELECT * FROM items').map(({data,...r})=>({...JSON.parse(data),...r})),marks:this.rows('SELECT * FROM marks'),files:this.rows('SELECT id,item,name FROM files'),notices:this.rows('SELECT * FROM notices ORDER BY stamp DESC'),history:this.rows('SELECT h.*,e.reason FROM history h LEFT JOIN goal_events e ON e.history_row=h.rowid ORDER BY h.rowid'),prefs:Object.fromEntries(this.rows('SELECT * FROM prefs').map(r=>[r.key,JSON.parse(r.value)]))}}
 save({id,kind,title,date,goal,plan,task,...data}){V.record(this,{id,kind,title,date,goal,plan,task,...data});const affected=new Set([...(kind==='goal'&&id?[id]:[]),...(kind==='task'?[+goal,this.rows('SELECT goal FROM items WHERE id=?',id||0)[0]?.goal]:[])] .filter(Boolean));let before=new Map([...affected].map(g=>[g,this.effectiveGoal(g)]));title=title.trim();if(!title||!/^\d{4}-\d\d-\d\d$/.test(date))throw Error('请填写名称和日期');let args=[kind,title,date,+goal||null,+plan||null,+task||null,JSON.stringify(data)];this.db.exec('SAVEPOINT save_item');try{if(id)this.run('UPDATE items SET kind=?,title=?,date=?,goal=?,plan=?,task=?,data=? WHERE id=?',...args,id);else id=Number(this.run('INSERT INTO items(kind,title,date,goal,plan,task,data) VALUES(?,?,?,?,?,?,?)',...args).lastInsertRowid);this.syncTags(id,data.tags);if(kind==='goal'&&!before.has(id))before.set(id,null);for(const [g,old] of before)this.noteProgress(g,old);this.db.exec('RELEASE save_item');return id}catch(e){this.db.exec('ROLLBACK TO save_item; RELEASE save_item');throw e}}
 pref(k,v){if(typeof k!=='string'||!k.length||k.length>160||v===undefined)throw Error('设置名称或内容无效');if(k.startsWith('draft')&&v!=null)V.fields(V.object(v));this.run('INSERT OR REPLACE INTO prefs VALUES(?,?)',k,JSON.stringify(v))}
 mark(id,day,value){V.date(day);let r=this.rows('SELECT kind,goal FROM items WHERE id=?',V.id(id))[0];if(!r||!['habit','task','milestone'].includes(r.kind)||!(r.kind==='habit'?['0','1']:['待完成','进行中','已完成','已取消']).includes(value))throw Error('无效的完成状态');this.atomic(()=>{let before=r.goal?this.effectiveGoal(r.goal):null;this.run('INSERT OR REPLACE INTO marks VALUES(?,?,?)',id,day,value);this.noteProgress(r.goal,before)})}
 amount(id,day,mode,value){
  V.date(day);V.id(id);
  if(!['add','set'].includes(mode)||!Number.isFinite(value)||value<0||(mode==='add'&&!value))throw Error('请输入有效数量');
  this.atomic(()=>{
   const habit=this.rows("SELECT date,data FROM items WHERE id=? AND kind='habit'",id)[0];
   if(!habit||day<habit.date)throw Error('日期早于习惯开始时间');
   const config=JSON.parse(habit.data),prior=this.rows('SELECT * FROM habit_days WHERE item=? AND day=?',id,day)[0];
   if(config.measure!=='数量')throw Error('请先启用数量模式');
   const total=mode==='add'?Number(((prior?.amount||0)+value).toFixed(6)):value;
   if(!Number.isFinite(total)||total>1e9)throw Error('数量超出范围');
   this.run('INSERT OR REPLACE INTO habit_days VALUES(?,?,?,?,?)',id,day,total,prior?.unit||config.unit.trim(),prior?.target||Number(config.target))
  })
 }
 remove(id){V.id(id);this.atomic(()=>{const g=this.rows('SELECT goal FROM items WHERE id=?',id)[0]?.goal,before=g?this.effectiveGoal(g):null;this.run('DELETE FROM items WHERE id=?',id);this.run('DELETE FROM draft_files WHERE draft=?','draft'+id);this.run('DELETE FROM prefs WHERE key=?','draft'+id);this.noteProgress(g,before)})}
 backup(file){this.run('VACUUM INTO ?',file)}
 close(){this.db.close()}
}
Object.assign(Store.prototype,require('./notebook.cjs'),require('./tags.cjs'),require('./progress.cjs'));module.exports=Store;
