function learningSummary(){const d=today(),year=stats(d.slice(0,4)+'-01-01',d);let map=new Map();for(const r of year.logs)for(const t of (r.tags||'').split(/[\s,，、;；]+/).filter(Boolean))map.set(t,(map.get(t)||0)+Number(r.minutes||0));return card('今年的学习',year.minutes+' 分钟'+(map.size?'<p>'+[...map].map(([t,n])=>esc(t)+' · '+n+' 分钟').join('　')+'</p>':''))}
function report(a,b,month=false){
 let s=stats(a,b),milestones=S.completions.filter(g=>g.day>=a&&g.day<=b),history=S.history.filter(h=>key(new Date(h.stamp))>=a&&key(new Date(h.stamp))<=b);
 const measured=quantityReport(a,b);if(!measured&&!s.total&&!s.minutes&&!s.journals&&!s.habits&&!history.length&&!s.range.length&&!records('moment').some(r=>days(a,b).some(d=>occurs(r,d))))return empty('这段时间还没有记录。');
 let body=card('这段时间',summary(s)+'　·　任务完成率 '+(s.total?Math.round(100*s.done/s.total)+'%':'—'));
 const periodDays=days(a,b),habitRows=records('habit').filter(h=>h.measure!=='数量').map(h=>{let due=periodDays.filter(d=>habitDue(h,d)),done=due.filter(d=>marked(h.id,d)==='1').length;return due.length?btn(h.title+' · '+done+' / '+due.length,'edit',h.id):''}).join('');
 body+=measured;if(habitRows)body+=card('习惯打卡',habitRows);
 const tasks=periodDays.flatMap(d=>tasksOn(d).filter(r=>status(r,d)!=='已取消').map(r=>({r,d})));
 if(tasks.length)body+='<details><summary>查看本期任务（'+tasks.length+'）</summary>'+tasks.map(({r,d})=>btn(d+' · '+r.title+' · '+status(r,d),'occurrence',r.id+'|'+d)).join('')+'</details>';
 if(s.logs.length)body+='<details><summary>查看学习记录</summary>'+listed(s.logs)+'</details>';
 if(history.length)body+=card('目标进度',history.map(h=>btn((item(h.item)?.title||'目标')+' · '+h.value+'%', 'edit',h.item)).join(''));
 if(month){let end=add(a,-1),prev=stats(end.slice(0,7)+'-01',end);body+=card('上月对照','任务完成 '+prev.done+' → '+s.done+'　·　学习 '+prev.minutes+' → '+s.minutes+' 分钟　·　日记 '+prev.journals+' → '+s.journals);
 let moments=records('moment').filter(r=>days(a,b).some(d=>occurs(r,d)));if(moments.length)body+=card('本月纪念日',listed(moments));if(milestones.length)body+=card('达成的目标',listed(milestones.map(g=>item(g.item)).filter(Boolean)));if(s.logs.length)body+=trend(a,b);let journals=s.range.filter(r=>r.kind==='journal');if(journals.length)body+=card('生活记录',journalList(journals))}
 const samples=periodDays.map(d=>stats(d,d));body+='<div class="reportgraphs">'+[['完成任务','done'],['学习分钟','minutes'],['习惯打卡','habits']].map(([label,k])=>{let max=Math.max(1,...samples.map(s=>s[k]));return '<figure><figcaption>'+label+'</figcaption><div class="reportplot">'+samples.map((s,i)=>'<i title="'+periodDays[i]+' · '+s[k]+'" style="height:'+100*s[k]/max+'%"></i>').join('')+'</div><small>'+a+' — '+b+'</small></figure>'}).join('')+'</div>';const achievements=s.range.filter(r=>r.kind==='achievement');if(achievements.length)body+=card('学习成果',listed(achievements));return body}

