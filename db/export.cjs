const path=require('node:path'),fs=require('node:fs/promises');
const safe=s=>String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/,'').slice(0,100)||'附件';
async function exportFolder(store,dir,attachmentsOnly=false){
 let folder=await fs.mkdtemp(path.join(dir,attachmentsOnly?'Daylight-附件-':'Daylight-手记-')),assets=path.join(folder,'assets');await fs.mkdir(assets);
 let result=store.state(),links=new Map(),index=['# Daylight 手记',''];
 for(const f of result.files){let name=f.id+'-'+safe(f.name);let bytes=store.rows('SELECT bytes FROM files WHERE id=?',f.id)[0]?.bytes;if(!bytes)throw Error('找不到附件：'+f.name);await fs.writeFile(path.join(assets,name),bytes);let url='assets/'+encodeURIComponent(name).replace(/[()]/g,c=>c==='('?'%28':'%29');links.set(f.id,url)}
 if(!attachmentsOnly){for(const r of result.items.filter(r=>['journal','log'].includes(r.kind))){let file=safe(r.date)+'-'+r.id+'.md',body=(r.notes||'').replace(/daylight-file:(\d+)/g,(s,id)=>links.get(+id)||s);
 let meta=['date','start','mood','tags','subject','minutes','plan','goal'].filter(k=>r[k]).map(k=>k+': '+JSON.stringify(r[k]));let lines=['---',...meta,'---','','# '+r.title,'',body];
 for(const k of ['content','problems','summary'])if(r[k])lines.push('',r[k]);
 for(const f of result.files.filter(f=>f.item===r.id)){if(body.includes(links.get(f.id)))continue;lines.push('',(/\.(png|gif|jpe?g|webp)$/i.test(f.name)?'!':'')+'['+f.name.replace(/[\[\]]/g,'')+']('+links.get(f.id)+')')}
 await fs.writeFile(path.join(folder,file),lines.join('\n'));index.push('- '+r.date+' · ['+r.title.replace(/[\[\]]/g,'')+']('+file+')')}await fs.writeFile(path.join(folder,'index.md'),index.join('\n'))}return folder
}
module.exports={exportFolder};
