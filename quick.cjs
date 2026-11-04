const {app,BrowserWindow,Tray,Menu,globalShortcut,nativeImage,ipcMain}=require('electron');
const path=require('node:path');
module.exports=function quickCapture(main,getStore,testing){
 let window,tray;
 function open(){if(!window||window.isDestroyed()){
 window=new BrowserWindow({title:'快速记录 · Daylight',width:480,height:475,minWidth:360,minHeight:370,show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'quick-preload.cjs'),sandbox:true}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());
 window.once('ready-to-show',()=>window?.show());window.loadFile(path.join(__dirname,'ui/quick.html'),{query:{theme:JSON.parse(getStore().rows("SELECT value FROM prefs WHERE key='appearance'")[0]?.value||'"跟随系统"')}});window.on('closed',()=>{window=null})
 }else{window.show();window.focus()}}
 ipcMain.handle('quickCommit',(e,token,r)=>{if(e.sender!==window?.webContents||e.senderFrame!==e.sender.mainFrame||!/^[-a-f0-9]{36}$/.test(token)||!['journal','task','log','moment'].includes(r.kind))throw Error('无效的快速记录');const store=getStore();let id=store.atomic(()=>{let existing=store.rows('SELECT item FROM quick_receipts WHERE token=?',token)[0];if(existing)return existing.item;let item=store.save(r);store.run('INSERT INTO quick_receipts VALUES(?,?)',token,item);return item});main.webContents.send('recordsChanged');return id});
 ipcMain.handle('openCapture',e=>{if(e.sender===main.webContents&&e.senderFrame===e.sender.mainFrame)open()});
 if(!testing){const registered=globalShortcut.register('CommandOrControl+Alt+J',open);getStore().pref('quickShortcut',registered?'Ctrl Alt J':'快捷键已被占用，可从托盘或设置打开');
 const pixels=Buffer.alloc(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){let i=(16*y+x)*4;if((x-7.5)**2+(y-7.5)**2<52){let fill=x<8?[72,89,65]:[193,217,224];pixels.set([...fill,255],i)}}const ico=nativeImage.createFromBitmap(pixels,{width:16,height:16});tray=new Tray(ico);tray.setToolTip('Daylight · 快速记录');tray.setContextMenu(Menu.buildFromTemplate([{label:'快速记录',click:open},{label:'打开 Daylight',click:()=>{main.show();main.focus()}},{label:'退出',click:()=>app.quit()}]));tray.on('click',open)}
 main.once('closed',()=>{window?.close();tray?.destroy();globalShortcut.unregister('CommandOrControl+Alt+J')})
};
