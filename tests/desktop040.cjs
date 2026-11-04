const assert=require('node:assert/strict');
module.exports=async function(win){
 const js=code=>win.webContents.executeJavaScript(code);
 await js(`(async()=>{
 const goal=await A.save({kind:'goal',title:'通过考试',date:day});
 const plan=await A.save({kind:'plan',title:'听力',subject:'英语',minutes:30,date:day,goal});await refresh();await act('planLog',plan);
 const form=dlg.querySelector('form');if(+form.elements.plan.value!==plan||+form.elements.goal.value!==goal||form.elements.subject.value!=='英语')throw Error('学习预填失败');
 form.elements.title.value='第一套听力';form.elements.minutes.value='45';form.requestSubmit();form.requestSubmit();
 for(let i=0;i<100&&dlg.open;i++)await new Promise(r=>setTimeout(r,25));await refresh();
 const logs=records('log').filter(x=>x.plan===plan);if(logs.length!==1||!learningDetail(item(plan)).includes('45 / 30'))throw Error('学习防重或合计异常');
 await A.save({...logs[0],minutes:12});await refresh();if(!learningDetail(item(plan)).includes('12 / 30'))throw Error('修改未重算');
 await A.remove(logs[0].id);await refresh();if(!learningDetail(item(plan)).includes('0 / 30'))throw Error('删除未重算');
 const id=await A.save({kind:'habit',title:'练听力',date:day,measure:'数量',target:20,unit:'分钟'});await refresh();await act('quantity',id+'|'+day);let f=dlg.querySelector('form');f.elements.amount.value='12';f.requestSubmit();f.requestSubmit();for(let i=0;i<100&&dlg.open;i++)await new Promise(r=>setTimeout(r,25));await refresh();
 if(!quantityRow(item(id),day).includes('未达标'))throw Error('部分投入未显示');
 await A.amount(id,day,'add',8);await refresh();if(!quantityReport(day,day).includes('20 分钟 · 达标 1 天'))throw Error('周投入统计错误')
 })()`);
 assert(await js("document.documentElement.scrollWidth<=innerWidth"))
};
