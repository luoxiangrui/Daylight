const {app}=require('electron'),fs=require('fs'),path=require('path');
const dir=process.env.DAYLIGHT_REOPEN_PROFILE;
if(!dir||!path.basename(dir).startsWith('daylight-reopen-'))throw Error('需要独立测试资料');
app.setPath('userData',dir);require('../main.cjs');
app.on('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{try{
 const js=s=>w.webContents.executeJavaScript(s);await js("(async()=>{for(let i=0;i<100&&!S;i++)await new Promise(r=>setTimeout(r,20));if(!S)throw Error('启动失败')})()");
 if(process.argv.includes('--first')){await js("act('welcome','')");await js(`(async()=>{let t=$('article textarea');t.value='散步到河边';t.dispatchEvent(new Event('input',{bubbles:true}));await A.stage('draftnew','河边.png',Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+9sAAAAASUVORK5CYII='),c=>c.charCodeAt(0)));await new Promise(r=>setTimeout(r,100));$('[data-a=expandWrite]').click()})()`);await new Promise(r=>setTimeout(r,180));await js("let t=dlg.querySelector('[name=notes]');t.value+='，回家继续写。';t.dispatchEvent(new Event('input',{bubbles:true}))");await new Promise(r=>setTimeout(r,150))}
 else{await js("if(S.prefs.draftnew.notes!=='散步到河边，回家继续写。'||S.draftFiles.length!==1)throw Error('未能恢复草稿与附件');$('[data-a=expandWrite]').click()");await new Promise(r=>setTimeout(r,180));await js("dlg.querySelector('form').requestSubmit()");await new Promise(r=>setTimeout(r,200));await js("if(records('journal').length!==1||S.files[0].item!==records('journal')[0].id)throw Error('保存后记录不符')")}
 app.quit()
 }catch(e){fs.writeFileSync(path.join(dir,'error.txt'),String(e.stack));app.exit(1)}}));
