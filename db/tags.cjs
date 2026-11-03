function names(text=''){return [...new Set(String(text||'').split(/[，,;；、\s]+/).map(t=>t.trim()).filter(Boolean))]}
module.exports={
 syncTags(id,text){this.run('DELETE FROM item_tags WHERE item=?',id);for(const name of names(text)){this.run('INSERT OR IGNORE INTO tags(name) VALUES(?)',name);this.run('INSERT OR IGNORE INTO item_tags SELECT ?,id FROM tags WHERE name=?',id,name)}},
 changeTag({action,id,name,color,target}){return this.atomic(()=>{if(['create','edit'].includes(action)){if(typeof name!=='string'||names(name).length!==1||names(name)[0]!==name||name.length>80||!/^#[a-f0-9]{6}$/i.test(color))throw Error('请填写一个标签名和有效颜色');if(action==='create'){this.run('INSERT INTO tags(name,color) VALUES(?,?)',name,color);return}}
 const affected=this.rows('SELECT item FROM item_tags WHERE tag=?',id);if(!this.rows('SELECT id FROM tags WHERE id=?',id).length)throw Error('标签不存在');
 if(action==='edit')this.run('UPDATE tags SET name=?,color=? WHERE id=?',name,color,id);
 else if(action==='merge'){if(id===target||!this.rows('SELECT id FROM tags WHERE id=?',target).length)throw Error('请选择其他标签');this.run('INSERT OR IGNORE INTO item_tags SELECT item,? FROM item_tags WHERE tag=?',target,id);this.run('DELETE FROM tags WHERE id=?',id)}
 else if(action==='delete')this.run('DELETE FROM tags WHERE id=?',id);else throw Error('未知标签操作');
 for(const {item} of affected){let tags=this.rows('SELECT name FROM tags JOIN item_tags ON tag=id WHERE item=? ORDER BY name',item).map(t=>t.name).join('，');this.run("UPDATE items SET data=json_set(data,'$.tags',?) WHERE id=?",tags,item)}})}
};
