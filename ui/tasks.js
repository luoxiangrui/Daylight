function recurring(r){return r.kind==='task'&&r.repeat&&r.repeat!=='不重复'}
function taskAt(r,date){indexState();return Dates.taskVersion(r,date,byEdition.get(r.id)||[])}
function tasksOn(date){return records('task').map(r=>taskAt(r,date)).filter(r=>occurs(r,date))}
function datedTaskRow(r,d){
 const st=status(r,d);return '<div class="taskline row" data-id="'+r.id+'" draggable="true">'+btn(st==='已完成'?'✓':'○','mark',r.id+'|'+d).replace('<button','<button title="'+(st==='已完成'?'撤销完成':'标记完成')+'" aria-label="'+(st==='已完成'?'撤销完成':'标记完成')+'"')+'<button class="record" data-a="occurrence" data-v="'+r.id+'|'+d+'">'+esc(r.title)+'</button><small>'+esc(st==='已完成'?'已完成':r.start||st)+'</small></div>'
}
function todayPage(){
 let tasks=tasksOn(day).sort((a,b)=>view==='时间轴'?(a.start||'99').localeCompare(b.start||'99'):(a.order||a.id)-(b.order||b.id));
 let focus=tasks.find(r=>r.id===S.prefs['focus:'+day]);
 let overdue=[];
 for(const r of records('task').filter(r=>r.date<day)){
  for(let d=r.date;d<day;d=add(d,1)){let v=taskAt(r,d);if(occurs(v,d)&&!['已完成','已取消'].includes(status(v,d)))overdue.push([v,d]);if(!recurring(r))break}
 }
 return '<div class="datehead"><small>今日手帐　·　'+parse(day).toLocaleDateString('zh-CN',{weekday:'long'})+'</small><h2>'+parse(day).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})+'</h2></div><div class="toolbar">'+datebar()+'</div><section class="focusline"><small>今天最想完成</small>'+(focus?datedTaskRow(focus,day):'<p>给今天选一件要紧的事。</p>')+(tasks.length?btn(focus?'换一件':'选择今日重点','chooseFocus','',focus?'':'accent'):btn('记下第一件事','new','task','accent'))+'</section><div class="sectionhead"><h3>当天任务</h3>'+btn('＋ 添加任务','new','task')+tabs(['列表','时间轴'],view,'view')+'</div>'+tasks.map(r=>datedTaskRow(r,day)).join('')+(overdue.length?'<details class="past"><summary>此前未完成　'+overdue.length+' 项</summary>'+overdue.reverse().map(([r,d])=>'<div class="pastrow"><small>'+d+' · 逾期</small>'+btn(r.title,'occurrence',r.id+'|'+d)+btn('今天做','bring',r.id+'|'+d)+btn('改期','reschedule',r.id+'|'+d)+'</div>').join('')+'<small>暂时不处理的任务会留在这里。</small></details>':'')
}
let occurrenceDay='';
function repeatEditor(r,date){
 occurrenceDay=date;let v=taskAt(r,date);
 const checked=S.steps.filter(m=>m.item===r.id&&m.day===date).map(m=>m.step);
 const steps=(v.subtasks||'').split('\n').map(s=>s.trim()).filter(Boolean);
 modal('<form id="repeatForm"><small>'+date+' · 重复任务</small><h2>'+esc(v.title)+'</h2>'+steps.map(s=>btn((checked.includes(s)?'✓ ':'○ ')+s,'dailyStep',s)).join('')+(r.checkedSteps?.length?'<details><summary>升级前的勾选记录</summary>'+esc(r.checkedSteps.join('、'))+'（旧版未记录日期）</details>':'')+'<details><summary>编辑任务安排</summary><div class="fields">'+['title','start','end','category','priority','tags','subtasks','notes','repeat','remind','advance','goal'].map(k=>field(k,v)).join('')+'</div><label>修改范围'+select('scope',[['day','只改这一天'],['future','从这天起修改']], 'day')+'</label><button type="submit" class="accent">保存安排</button></details>'+btn('返回','close')+'</form>');
 const form=$('#repeatForm');form.elements.repeat.disabled=true;form.elements.scope.onchange=()=>{form.elements.repeat.disabled=form.elements.scope.value==='day'};form.querySelectorAll('[data-a]').forEach(b=>b.type='button');
 form.querySelectorAll('[data-a=dailyStep]').forEach(b=>b.onclick=async e=>{e.stopPropagation();await A.toggleStep(r.id,date,b.dataset.v);S=await A.state();const on=S.steps.some(m=>m.item===r.id&&m.day===date&&m.step===b.dataset.v);b.textContent=(on?'✓ ':'○ ')+b.dataset.v});
 form.onsubmit=async e=>{e.preventDefault();try{let data=Object.fromEntries(new FormData(form)),scope=data.scope;delete data.scope;if(scope==='day')delete data.repeat;else if(data.repeat!==v.repeat)data.date=date;await A.edition(r.id,date,scope,data);dlg.close();await refresh();toast('安排已保存')}catch(err){toast(err.message)}}
}
async function taskAction(a,v){
 if(a==='chooseFocus'){modal('<h2>今天最想完成哪一件？</h2>'+tasksOn(day).map(r=>btn(r.title,'setFocus',r.id)).join('')+btn('返回','close'));return}
 if(a==='setFocus'){await A.pref('focus:'+day,+v);dlg.close();await refresh();return}
 let [id,d]=v.split('|'),r=item(id);
 if(a==='occurrence'){if(recurring(r))repeatEditor(r,d);else editor(r);return}
 if(a==='reschedule'){modal('<h2>改到哪一天？</h2>'+input('moveDate',day,'date')+btn('确定','moveTo',v,'accent')+btn('返回','close'));return}
 let target=a==='bring'?day:$('[name=moveDate]').value;if(!target)return;
 if(recurring(r))await A.moveOccurrence(taskAt(r,d),d,target);else await A.save({...r,date:target});
 if(dlg.open)dlg.close();await refresh();toast('已安排到 '+target)
}
