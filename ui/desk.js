let homeLayout=false;
function metric(label,value,unit=''){return '<div class="metriccell"><small>'+esc(label)+'</small><b>'+esc(value)+'</b><span>'+esc(unit)+'</span></div>'}
function bookPanel(title,content,key){return '<section class="bookpanel '+key+'" data-module="'+key+'" '+(homeLayout?'draggable="true" data-layout="'+key+'"':'')+'><h3>'+esc(title)+'</h3>'+content+'</section>'}
function desk(){
 const d=today(),hour=new Date().getHours(),s=stats(d,d),tasks=tasksOn(d),focus=tasks.find(r=>r.id===S.prefs['focus:'+d]),goals=records('goal').filter(r=>progress(r)<100),habits=records('habit').filter(r=>habitDue(r,d)),doneHabits=habits.filter(r=>habitMet(r,d)).length;

 const top='<div class="welcome"><small>'+parse(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})+'</small><h2>'+(hour<11?'早上好':hour<14?'中午好':hour<18?'下午好':'晚上好')+'，'+esc(S.prefs.nick||'朋友')+'</h2>'+'<div>'+btn(homeLayout?'完成布局':'调整布局','homeLayout')+btn('快速记录到日记、任务或学习','openCapture')+'</div></div>';
 const steps=focus?(focus.subtasks||'').split('\n').map(s=>s.trim()).filter(Boolean):[];
 const next=steps.find(s=>recurring(focus)?!S.steps.some(x=>x.item===focus.id&&x.day===d&&x.step===s):!focus.checkedSteps?.includes(s));
 const focusBody=focus?'<div class="focusSpread"><div><h3>'+esc(focus.title)+'</h3><small>'+esc(status(focus,d))+'</small>'+(next&&status(focus,d)!=='已完成'?'<p>下一步 · '+esc(next)+'</p>':'')+'<div class="toolbar">'+btn(status(focus,d)==='已完成'?'撤回完成':'标为完成','mark',focus.id+'|'+d,'accent')+btn(steps.length?'查看步骤':'查看任务','occurrence',focus.id+'|'+d)+btn('更换重点','chooseFocus')+'</div></div></div>':tasks.length?btn('选择今日重点','chooseFocus','','accent'):btn('添加今天的第一项任务','new','task','accent');
 const schedule=calendarSegments(d).filter(x=>['task','event'].includes(x.r.kind)).sort((a,b)=>a.start-b.start);
 const modules={
 task:()=>bookPanel('今日重点',focusBody,'task'),
 summary:()=>bookPanel('今天的进度','<div class="metrics">'+metric('任务',s.done+' / '+s.total)+metric('学习',s.minutes,'分钟')+metric('习惯',doneHabits+' / '+habits.length)+metric(goals[0]?.title||'目标进度',goals[0]?progress(goals[0])+'%':'—')+'</div>','summary'),
 week:()=>bookPanel('今日时间安排',schedule.map(x=>'<div class="dayline"><small>'+esc(x.r.start||'全天')+'</small>'+btn(x.r.title,x.r.kind==='task'?'occurrence':'edit',x.r.kind==='task'?x.r.id+'|'+x.origin:x.r.id)+(x.conflict?'<small class="warning">时间重叠</small>':'')+'</div>').join('')+futureEvents(d)||empty('今天没有排定时间的事项。'),'week'),
 journal:()=>bookPanel('最近记录',listed([...records('journal'),...records('achievement'),...S.completions.map(g=>item(g.item)).filter(Boolean)].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,4),d),'journal'),
 goal:()=>bookPanel('目标与里程碑',listed([...goals,...records('milestone')].sort((a,b)=>(a.endDate||a.date).localeCompare(b.endDate||b.date)).slice(0,4),d),'goal'),
 moment:()=>bookPanel('即将到来的纪念日',listed(records('moment').filter(r=>nextDate(r,d)).sort((a,b)=>nextDate(a,d).localeCompare(nextDate(b,d))).slice(0,3),d),'moment'),
 plan:()=>bookPanel('学习计划',records('plan').filter(r=>occurs(r,d)).map(learningDetail).join('')||empty('今天没有学习计划。'),'plan'),
 habit:()=>bookPanel('今天的习惯',listed(habits,d),'habit')};
 const blocks=order().filter(k=>modules[k]).map(k=>modules[k]());blocks.splice(Math.min(1,blocks.length),0,'<div class="deskWriter">'+compose({kind:'journal',date:d},false)+'</div>');return top+'<div class="bookgrid">'+blocks.join('')+'</div>'
}
function futureEvents(d){let rs=records('event').filter(r=>r.date>d&&r.date<=add(d,7)).sort((a,b)=>a.date.localeCompare(b.date));return rs.length?'<small>未来七天</small>'+listed(rs.slice(0,3),d):''}
const defaultModules=['task','week','summary','journal','goal','moment','plan','habit'];
function settings(){
 const group=(title,desc,body)=>'<section id="setting-'+title+'" class="settinggroup"><h3>'+title+'</h3><p class="muted">'+desc+'</p>'+body+'</section>';
 const visible=order(),all=[...visible,...defaultModules.filter(k=>!visible.includes(k))];
 return '<div class="settingsjump">'+['外观与个人资料','首页布局','自动备份','从备份恢复','文件导出','关于 Daylight'].map(t=>btn(t,'jumpSetting',t)).join('')+'</div>'+group('外观与个人资料','选择阅读时的配色，昵称会出现在首页。',select('appearance',['浅色','深色','跟随系统'].map(x=>[x,x]),S.prefs.appearance||(S.prefs.dark?'深色':'浅色'))+input('nick',S.prefs.nick||'')+btn('保存昵称','nickname'))+
 group('首页布局','拖动模块调整顺序，也可以用上移按钮。',all.map(k=>'<div class="layoutrow" draggable="true" data-layout="'+k+'">'+btn(visible.includes(k)?'显示':'隐藏','card',k)+esc(cardNames[k])+btn('上移','up',k)+'</div>').join('')+btn('恢复默认顺序','resetLayout'))+
 group('提醒','选择可以弹出本地通知的记录类型。',Object.entries(kinds).filter(([k])=>layouts[k].includes('remind')).map(([k,n])=>btn(n+' · '+(S.prefs['notice'+k]===false?'关闭':'开启'),'notice',k)).join(''))+
 group('快捷键','Ctrl K 搜索 · Ctrl N 新增 · '+esc(S.prefs.quickShortcut||'Ctrl Alt J 快速记录'),btn('打开快速记录','openCapture'))+
 group('本地数据','你的记录和附件保存在这台设备。完整备份包含私人内容，请自行保管。',btn('创建完整备份','backup'))+
 group('自动备份','程序运行时检查备份周期。成功生成新快照后才清理过期份数。','<div class="toolbar"><label>备份周期'+select('autoFreq',['关闭','每日','每周'].map(x=>[x,x]),S.prefs['auto.frequency']||'关闭')+'</label><label>保留份数'+input('autoKeep',S.prefs['auto.keep']||7,'number')+'</label></div>'+btn('选择目录','autoDirectory')+btn('保存设置','autoConfig')+btn('立即备份','autoNow')+'<p>'+esc(S.prefs['auto.dir']||'尚未选择目录')+' · '+esc(S.prefs['auto.status']||'暂无备份')+'</p>')+
 group('从备份恢复','恢复将替换当前记录。选择文件后可核对数量，确认前会保留原库副本。',btn('选择备份文件','restore','','danger'))+
 group('文件导出','Markdown 手记包含索引、正文和相对路径的附件目录。',btn('导出 Markdown 与附件','exportBook')+btn('仅导出附件','exportFiles'))+
 group('标签管理','标签可跨记录使用，修改前可查看影响范围。',tagsPanel())+group('关于 Daylight','Daylight 0.4.0 · Windows x64','<small>本地生活手帐</small>')
}
function goalTree(){
 const all=records('goal'),seen=new Set();
 function node(r){if(seen.has(r.id))return '';seen.add(r.id);let kids=all.filter(i=>i.goal===r.id),steps=records('milestone').filter(i=>i.goal===r.id),tasks=records('task').filter(i=>i.goal===r.id);
 return '<div class="branch"><small>'+esc(r.level||'目标')+' · '+esc(r.endDate||'未设截止日期')+'</small>'+row(r,day)+'<progress max="100" value="'+progress(r)+'"></progress>'+(steps.length||tasks.length?'<details><summary>'+steps.length+' 个里程碑 · '+tasks.length+' 项任务</summary>'+listed([...steps,...tasks])+'</details>':'')+kids.map(node).join('')+'</div>'}
 return all.filter(r=>!all.some(g=>g.id===r.goal)).map(node).join('')+all.filter(r=>!seen.has(r.id)).map(node).join('')||empty('添加一个目标，再按阶段拆分。')
}
function momentPage(){
 let d=today();return records('moment').map(r=>({r,next:nextDate(r,d)})).sort((a,b)=>view==='时间线'?a.r.date.localeCompare(b.r.date):(a.next||'9999').localeCompare(b.next||'9999')).map(({r,next})=>{
 const years=Math.max(0,+d.slice(0,4)-Number(r.date.slice(0,4))-(d.slice(5)<r.date.slice(5)?1:0));
 return '<section class="momentline"><div class="counter"><b>'+Math.abs(diff(next||r.date,d))+'</b><small>'+ (next?'天后':'天前')+'</small></div><div><small>'+esc(r.category||'纪念日')+(r.important==='重要'?' · 重要':'')+'</small>'+btn(r.title,'edit',r.id)+'<small>'+esc(view==='时间线'?r.date:next||r.date)+' · '+esc(r.repeat||'不重复')+(years?' · 已过 '+years+' 年':'')+'</small></div></section>'}).join('')||empty('记下一个值得记住的日期。')
}

let habitSpan='月';function habitDates(d){return days(habitSpan==='年'?d.slice(0,4)+'-01-01':habitSpan==='周'?weekStart(d):d.slice(0,7)+'-01',habitSpan==='年'?d.slice(0,4)+'-12-31':habitSpan==='周'?add(weekStart(d),6):key(new Date(parse(d).getFullYear(),parse(d).getMonth()+1,0)))}
