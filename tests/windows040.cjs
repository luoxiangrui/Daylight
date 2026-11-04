const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os'),{DatabaseSync}=require('node:sqlite'),D=require('../ui/dates');
const stage=process.argv.includes('--before')?'before':'after',out=path.resolve(__dirname,'../release/0.4.0-路径');
fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'daylight-window-'));app.setPath('userData',profile);
const file=path.join(profile,'daylight.sqlite'),db=new DatabaseSync(file),day=D.today(),yesterday=D.add(day,-1);
db.exec(fs.readFileSync(path.join(__dirname,'../db/001.sql'),'utf8'));
function add(kind,title,date,extra={},goal=null){return Number(db.prepare('INSERT INTO items(kind,title,date,data,goal) VALUES(?,?,?,?,?)').run(kind,title,date,JSON.stringify(extra),goal).lastInsertRowid)}
let goal=add('goal','整理家里的书',day,{level:'短期'}),task=add('task','睡前整理',yesterday,{repeat:'每天',subtasks:'收拾书桌\n准备明天的包',checkedSteps:['收拾书桌']},goal);
add('task','去邮局寄明信片',yesterday);add('task','读完借来的散文集',day);let done=add('task','把厨房的窗台擦干净',day);db.prepare('INSERT INTO marks VALUES(?,?,?)').run(done,day,'已完成');
let notes=('早上绕到巷口买豆浆，平常坐着收报纸的那位爷爷，今天把椅子挪到了太阳底下。我在旁边等了一会儿，看他把每一张折角慢慢抹平。回来时风吹过窗台，昨天晾的衬衫已经干了。\n\n')+('下午把借来的书翻到上次夹车票的那一页。车票背面还留着一行铅笔字，想了半天才记起来，那天是为了等一场雨停才进的书店。桌子太乱，我索性把旧票据收到同一个信封里。以后再翻到，应该还能认出是哪一趟车。\n\n')+('晚饭后沿河走了两站路。路灯刚刚亮起来，水面映着一排细细的光。小朋友蹲在桥边数船，数到第三条就忘了前面两条是什么颜色，他爸爸也蹲下来陪他重新数。我没有拿手机，站在那里听了一会儿。回家时楼下的花店正在关门，门口那盆薄荷还没搬进去，叶子碰到手背，有一点凉。');
let journal=add('journal','巷口的早晨',day,{notes,mood:'平静'});add('habit','散步',yesterday);let img=path.join(process.env.WINDIR,'Web/Wallpaper/Windows/img0.jpg');if(!fs.existsSync(img))throw Error('Missing fixture photo');db.prepare('INSERT INTO files(item,name,bytes) VALUES(?,?,?)').run(journal,'桌面照片.jpg',fs.readFileSync(img));
for(let [k,v] of Object.entries({onboard:true,nick:'小禾'}))db.prepare('INSERT INTO prefs VALUES(?,?)').run(k,JSON.stringify(v));db.close();
require('../main.cjs');
app.on('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const js=code=>win.webContents.executeJavaScript(code),wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(400);win.setSize(1200,840);win.webContents.debugger.attach('1.3');const capture=async()=>{await new Promise(r=>setTimeout(r,200));let result=await win.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});let bytes=Buffer.from(result.data,'base64');if(bytes.length<5000)throw Error('空白截图');return bytes};if(stage==='after'){await js("A.pref('focus:'+day,"+task+").then(()=>A.pref('week:'+weekStart(day),{pick:'"+journal+"|'+day,photos:[S.files[0].id],idea:'再去河边走一趟'})).then(refresh)")}
 for(let p of ['today','journal','calendar','insights']){await js("act('page','"+p+"')");if(p==='journal'){await js("editor(records('journal')[0])");if(stage==='after')await js("act('focusWrite','')")}await wait(300);fs.writeFileSync(path.join(out,stage+'-'+p+'.png'),await capture());if(p==='journal')await js('dlg.close()')}
 if(stage==='after')await require('./paths.cjs')({win,js,wait,out,profile,task,journal,day,capture});
 fs.writeFileSync(path.join(out,stage+'-result.txt'),'PASS '+new Date().toISOString()+' DPR='+await js('devicePixelRatio'));app.exit(0)
 }catch(e){fs.writeFileSync(path.join(out,stage+'-result.txt'),String(e.stack));app.exit(1)}}));

