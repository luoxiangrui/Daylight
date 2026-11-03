module.exports={
 atomic(fn){this.db.exec('SAVEPOINT notebook');try{const result=fn();this.db.exec('RELEASE notebook');return result}catch(e){this.db.exec('ROLLBACK TO notebook; RELEASE notebook');throw e}},
 toggleStep(id,date,step){if(!this.run('DELETE FROM daily_steps WHERE item=? AND day=? AND step=?',id,date,step).changes)this.run('INSERT INTO daily_steps VALUES(?,?,?)',id,date,step)},
 edition(id,date,scope,fields){if(!['day','future'].includes(scope))throw Error('请选择修改范围');this.run('INSERT OR REPLACE INTO editions VALUES(?,?,?,?)',id,date,scope,JSON.stringify(fields))},
 stage(draft,name,bytes){this.run('INSERT INTO draft_files(draft,name,bytes) VALUES(?,?,?)',draft,name,Buffer.from(bytes))},
 publish(record,draft){return this.atomic(()=>{const id=this.save(record);this.run('INSERT INTO files(item,name,bytes) SELECT ?,name,bytes FROM draft_files WHERE draft=?',id,draft);this.run('DELETE FROM draft_files WHERE draft=?',draft);this.pref(draft,null);return id})},
 nextTask(week,title,date){return this.atomic(()=>{let old=this.rows('SELECT item FROM next_tasks WHERE week=?',week)[0];if(old?.item)return old.item;let id=this.save({kind:'task',title,date});this.run('INSERT OR REPLACE INTO next_tasks VALUES(?,?)',week,id);return id})},
 moveOccurrence(r,from,to){return this.atomic(()=>{let id=this.save({...r,id:undefined,date:to,repeat:'不重复',checkedSteps:[],status:'待完成'});this.mark(r.id,from,'已取消');return id})}
};
