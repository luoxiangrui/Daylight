const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('capture',{save:(token,r)=>ipcRenderer.invoke('quickCommit',token,r)});
