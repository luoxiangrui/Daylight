const imageName=name=>/\.(png|jpe?g|gif|webp)$/i.test(name);
function picture(f,staged=false){return '<img class="entryphoto" loading="lazy" alt="'+esc(f.name)+'" data-photo="'+f.id+'" '+(staged?'data-staged':'')+'>'}
function journalList(rs){
 let last='';return rs.map(r=>{const heading=r.date===last?'':'<h3 class="groupdate">'+r.date+'</h3>';last=r.date;
 const photo=S.files.find(f=>f.item===r.id&&imageName(f.name));
 return heading+'<button class="excerpt" data-a="edit" data-v="'+r.id+'"><span><small>'+esc([r.start,r.mood,r.tags].filter(Boolean).join(' · '))+'</small><p>'+esc((r.notes||r.title).slice(0,view==='时间线'?400:130))+'</p>'+(r.notes?'<small>'+esc(r.title)+'</small>':'')+'</span>'+(photo?picture(photo):'')+'</button>'}).join('')||empty('写下第一篇日记后，会在这里按日期排列。')
}
const draftKey=r=>'draft'+(r.id||'new');
function compose(r,full){
 const draft={...r,...S.prefs[draftKey(r)]};
 const meta=['date','start','mood','weather','category','tags','important'];
 return '<form id="'+(full?'editor':'quicknote')+'" class="compose '+(full?'longform':'quicknote')+'"><div class="composehead">'+(full?btn('‹ 返回','leaveJournal'):'<h3>写下此刻</h3>')+'<small class="draftstatus" role="status">'+(S.prefs[draftKey(r)]?'草稿已保存':'')+'</small>'+(full?btn('专注模式','focusWrite'):'')+'</div>'+(full?'<input name="title" aria-label="日记标题" placeholder="标题（可不填）" value="'+esc(draft.title)+'">':'')+'<textarea name="notes" aria-label="日记正文" placeholder="刚才发生了什么？也可以直接粘贴照片。">'+esc(draft.notes)+'</textarea><div class="attachments"></div>'+(full?'<details class="more"><summary>日期、心情和排版</summary><div class="fields">'+meta.map(k=>k==='mood'?'<label>心情'+select(k,[['','跳过'],...choices.mood.map(v=>[v,v])],draft.mood)+'</label>':field(k,draft)).join('')+journalTools()+'</div></details>':'')+'<div class="writerfoot"><label class="filepick">＋ 附件<input type="file" multiple aria-label="选择附件"></label>'+(full?'':btn('展开写','expandWrite'))+'<button class="accent" type="submit">写入日记</button></div>'+(full&&r.id?'<details><summary>其他操作</summary>'+btn('删除日记','remove',r.id)+'</details>':'')+'</form>'
}
function bindWriter(form,r,full){
 let draft={...r,...S.prefs[draftKey(r)]},pending=Promise.resolve(),writing=false;
 const k=draftKey(r),message=t=>form.querySelector('.draftstatus').textContent=t;
 const values=()=>({...draft,...Object.fromEntries([...new FormData(form)].filter(([name])=>name))});
 const remember=()=>{draft=values();S.prefs[k]=draft;let snap={...draft};message('正在存草稿…');pending=pending.catch(()=>{}).then(()=>A.pref(k,snap)).then(()=>message('草稿已保存')).catch(e=>{message('草稿未保存，可再试一次');throw e});pending.catch(()=>{});return pending};
 function photos(){let staged=S.draftFiles.filter(f=>f.draft===k),old=S.files.filter(f=>f.item===r.id);form.querySelector('.attachments').innerHTML=[...old,...staged].map(f=>imageName(f.name)?picture(f,staged.includes(f)):esc(f.name)).join(' ')+old.map(f=>btn('另存 '+f.name,'extract',f.id)).join('');form.querySelectorAll('button[data-a]').forEach(b=>b.type='button');loadPhotos().catch(e=>message(e.message))}
 let stageQueue=Promise.resolve(),waiting=[];function addFiles(files){waiting.push(...files);stageQueue=stageQueue.catch(()=>{}).then(async()=>{await remember();while(waiting.length){let f=waiting[0];await A.stage(k,f.name||'剪贴板.png',new Uint8Array(await f.arrayBuffer()));waiting.shift()}S.draftFiles=(await A.state()).draftFiles;photos();message('草稿已保存')});stageQueue.catch(e=>message('附件未存入，请重试：'+e.message));return stageQueue}
 photos();form.oninput=e=>{if(e.target.type!=='file')remember()};form.querySelector('[type=file]').onchange=e=>addFiles([...e.target.files]);
 form.onpaste=e=>{let images=[...e.clipboardData.items].filter(i=>i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);if(images.length){e.preventDefault();addFiles(images)}};
 form.querySelector('[data-a=expandWrite]')?.addEventListener('click',async e=>{e.stopPropagation();await stageQueue;await remember();journalEditor(draft)});
 form.querySelector('[data-a=leaveJournal]')?.addEventListener('click',async e=>{e.stopPropagation();await stageQueue;await remember();dlg.close();await refresh()});
 form.onsubmit=async e=>{e.preventDefault();if(writing)return;writing=true;let submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{if(waiting.length)await addFiles([]);else await stageQueue;await pending.catch(()=>{});let v=values(),hasFile=S.draftFiles.some(f=>f.draft===k)||S.files.some(f=>f.item===r.id);if(!(v.notes||'').trim()&&!(v.title||'').trim()&&!hasFile)throw Error('先写一句话，或加一张照片');v.title=(v.title||'').trim()||(v.notes||'').trim().split('\n')[0].slice(0,32)||'照片';await A.publish(v,k);if(dlg.open)dlg.close();page='journal';day=v.date;filter=journalDate='';sameDay=false;await refresh();toast('已写入日记');document.querySelector('.excerpt')?.scrollIntoView({block:'nearest'})}
 catch(err){message('未写入：'+err.message);submit.textContent='重试保存'}finally{submit.disabled=false;writing=false}}
}
function journalEditor(r){modal(compose(r,true));dlg.classList.add('journalpanel');bindWriter(dlg.querySelector('form'),r,true)}

