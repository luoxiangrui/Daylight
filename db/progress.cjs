const {today}=require('../ui/dates');
module.exports={
 effectiveGoal(id){let g=this.rows("SELECT data FROM items WHERE id=? AND kind='goal'",id)[0];if(!g)return null;let data=JSON.parse(g.data);if(data.mode!=='关联任务')return Number(data.progress||0);
 let s=this.rows("SELECT coalesce(m.value,json_extract(i.data,'$.status'),'待完成') status FROM items i LEFT JOIN marks m ON m.item=i.id AND m.day=i.date WHERE i.kind='task' AND i.goal=?",id).map(x=>x.status).filter(x=>x!=='已取消');return s.length?Math.round(s.filter(x=>x==='已完成').length*100/s.length):0},
 noteProgress(id,before){if(!id)return;let after=this.effectiveGoal(id);if(after===null||before===after)return;let stamp=new Date().toISOString(),row=this.run('INSERT INTO history VALUES(?,?,?)',id,stamp,after);this.run('INSERT INTO goal_events VALUES(?,?)',row.lastInsertRowid,before===null?'创建':'进度');if(after===100)this.run('INSERT OR IGNORE INTO completions VALUES(?,?)',id,today());else this.run('DELETE FROM completions WHERE item=?',id)}
};
