// A short real-window measurement; never open the current user's profile.
const {app}=require('electron'),fs=require('fs'),path=require('path'),os=require('os'),Store=require('../db/store.cjs'),D=require('../ui/dates');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'daylight-volume-'));app.setPath('userData',root);
const db=new Store(path.join(root,'daylight.sqlite')),day=D.today();
db.atomic(()=>{for(let i=0;i<2000;i++)db.save({kind:i%2?'task':'journal',title:'样本 '+i,date:D.add(day,-(i%31)),notes:'河边散步，抬头看云。'.repeat(35),tags:'散步'});db.pref('onboard',true)});db.close();
const start=Date.now();require('../main.cjs');
app.once('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const js=s=>win.webContents.executeJavaScript(s);await js("(async()=>{while(!S)await new Promise(r=>setTimeout(r,20))})()");
 const results={records:2000,desktopReadyMs:Date.now()-start,shortcut:await js("S.prefs.quickShortcut")};
 for(let page of ['today','calendar','journal','insights','search'])results[page+'Ms']=await js("(async()=>{let start=performance.now();await act('page','"+page+"');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return Math.round(performance.now()-start)})()");
 fs.writeFileSync(path.join(__dirname,'../docs/v0.3-volume.json'),JSON.stringify(results,null,2));app.quit()
 }catch(e){console.error(e);app.exit(1)}}));
