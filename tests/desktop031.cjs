const assert=require('node:assert/strict');
module.exports=async function check(win){
 const js=code=>win.webContents.executeJavaScript(code);
 await js("act('page','home');");await js(`(async()=>{let t=document.querySelector('#quicknote textarea');const old=(await A.state()).prefs.draftnew;t.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));t.value='輸入中';t.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));await new Promise(r=>setTimeout(r,60));if(JSON.stringify((await A.state()).prefs.draftnew)!==JSON.stringify(old))throw Error('组合中提前保存');t.value='输入完成';t.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));await new Promise(r=>setTimeout(r,100));if((await A.state()).prefs.draftnew.notes!=='输入完成')throw Error('组合结束未保存')})()`);
 await js("A.save({kind:'task',title:'夜间整理',date:'2026-01-31',endDate:'2026-02-01',repeat:'每周',start:'23:30',end:'00:30'}).then(refresh)");
 assert(await js("calendarSegments('2026-02-08').some(x=>x.r.title==='夜间整理'&&x.start===0&&x.end===30&&x.origin==='2026-02-07')"));
 assert(await js("calendarSegments('2026-02-01').some(x=>x.origin==='2026-01-31'&&x.end===30)"));
 await js("act('page','settings')");assert(await js("document.querySelectorAll('[data-a=exportBook]').length===1&&!document.querySelector('[data-a=markdown]')"));
 await js("act('resetLayout','')");assert(await js("JSON.stringify(S.prefs.cards)===JSON.stringify(defaultModules)"));
};
