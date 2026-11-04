const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{app}=require('electron');
const base=process.env.DAYLIGHT_TEST_APP,output=process.env.DAYLIGHT_TEST_OUT,profile=process.argv[2];
if(!base||!output||!['空库','单条','高密度'].includes(profile))throw Error('需要测试版本目录和样本类型');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'daylight-window-scenarios-'));app.setPath('userData',root);
const Store=require(path.join(base,'db/store.cjs')),s=new Store(path.join(root,'daylight.sqlite')),d=require(path.join(base,'ui/dates.js')).today();
s.pref('onboard',true);
if(profile!=='空库')s.save({kind:'task',date:d,title:'在周末前整理学习笔记和生活里的小发现'.repeat(20)});
if(profile==='高密度'){
 for(let n=1;n<=40;n++)s.save({kind:'task',date:d,title:'复习第 '+n+' 组听力'});
 const j=s.save({kind:'journal',date:d,title:'走回家的路',notes:'天刚亮，巷口的小店已经开门。回来的路上记下了今天想做的事。'.repeat(32)});
 const b=fs.readFileSync(path.join(process.env.WINDIR,'Web/Wallpaper/Windows/img0.jpg'));
 for(let i=0;i<4;i++)s.run('INSERT INTO files(item,name,bytes) VALUES(?,?,?)',j,'照片'+i+'.jpg',b)
}
s.close();const out=path.join(output,profile);fs.mkdirSync(out,{recursive:true});
require(path.join(base,'main.cjs'));
app.once('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{try{
 const js=t=>w.webContents.executeJavaScript(t),debug=w.webContents.debugger;await js('(async()=>{while(!S)await new Promise(r=>setTimeout(r,30))})()');debug.attach('1.3');
 for(const page of ['home','today','journal','calendar','insights']){
  for(const [width,scale,theme] of [[800,1.5,'深色'],[1200,1.25,'浅色']]){
   w.setContentSize(width,750);await debug.sendCommand('Emulation.setDeviceMetricsOverride',{width,height:750,deviceScaleFactor:scale,mobile:false});
   await js("if(dlg.open)dlg.close();A.pref('appearance','"+theme+"').then(refresh)");await js("act('page','"+page+"')");
   if(page==='journal')await js("editor(records('journal')[0]||{kind:'journal',date:day})");
   await new Promise(r=>setTimeout(r,170));assert(await js('document.documentElement.scrollWidth<=innerWidth'),profile+page);
   if(page==='journal'){assert(await js("dlg.querySelector('[type=submit]')!==null"));await js("dlg.querySelector('[type=submit]').scrollIntoView({block:'nearest'})");assert(await js("dlg.querySelector('[type=submit]').getBoundingClientRect().bottom<=innerHeight"))}
   const shot=await debug.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,page+'-'+width+'-'+scale+'-'+theme+'.png'),Buffer.from(shot.data,'base64'))
  }
 }
 app.exit(0)
}catch(e){fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)}}))
