const {BrowserWindow}=require('electron'),assert=require('node:assert/strict');
module.exports=async function(win){
 const js=s=>win.webContents.executeJavaScript(s),pause=ms=>new Promise(r=>setTimeout(r,ms));
 await js("act('openCapture','')");let w=BrowserWindow.getAllWindows().find(w=>w.id!==win.id);
 for(let i=0;i<100&&!await w.webContents.executeJavaScript("!!document.querySelector('#capture textarea')");i++)await pause(25);
 await w.webContents.executeJavaScript("form.elements.notes.value='窗外的雨点';form.requestSubmit()");
 for(let i=0;i<100&&!await w.webContents.executeJavaScript("document.querySelector('[role=status]').textContent==='已保存'");i++)await pause(25);
 assert(await js("refresh().then(()=>records('journal').some(r=>r.title==='窗外的雨点'))"));w.close();
 await js("A.save({kind:'task',title:'午后散步',date:today(),start:'13:00',end:'14:00',notes:'沿着老街看雨',tags:'散步'}).then(refresh)");
 await js("act('page','search');$('#search').value='午后 老街';kindFilter='task';render()");assert(await js("foundRecords().length===1&&$('article').innerText.includes('沿着老街')"));
 await js("act('page','calendar');cal='日';render()");await js(`(async()=>{let r=records('task').find(r=>r.title==='午后散步'),dt=new DataTransfer();let source=document.querySelector('[data-moving="'+r.id+'"]');source.dispatchEvent(new DragEvent('dragstart',{dataTransfer:dt,bubbles:true}));let section=document.querySelector('[data-hour="15:00"]');let ask=window.confirm;try{window.confirm=()=>false;await dropCalendar({target:section,dataTransfer:dt});if(item(r.id).start!=='13:00')throw Error('取消后发生变更');window.confirm=()=>true;await dropCalendar({target:section,dataTransfer:dt});if(item(r.id).start!=='15:00'||item(r.id).end!=='16:00')throw Error('拖动未保留时长')}finally{window.confirm=ask}})()`);
 await js("act('page','journal');editor(records('journal')[0]);[...dlg.querySelectorAll('button')].find(b=>b.textContent==='富文本编辑').click()");
 assert(await js("!!dlg.querySelector('[contenteditable=true]')"));await js("dlg.querySelector('.richpad').innerHTML='<strong>测试加粗</strong>';dlg.querySelector('.richpad').dispatchEvent(new Event('input'));if(!dlg.querySelector('[name=notes]').value.includes('**测试加粗**'))throw Error('富文本转换失败');dlg.close()");
};
