function calendarSegments(date,types=calendarKinds){
 let segments=[];
 for(const base of S.items){if(!types.includes(base.kind))continue;
 if(!['event','task'].includes(base.kind)){if(scheduled(base,date))segments.push({r:base,origin:date,start:0,end:1440,all:true});continue}
 const editions=byEdition?.get(base.id)||[],span=Math.max(0,diff(base.endDate||base.date,base.date),...editions.map(e=>e.data.endDate?diff(e.data.endDate,e.data.date||base.date):0));
 const first=base.repeat&&base.repeat!=='不重复'?add(date,-span):base.date;
 for(let origin=first;origin<=date;origin=add(origin,1)){
 let r=taskAt(base,origin),duration=Math.max(0,diff(r.endDate||r.date,r.date)),last=add(origin,duration);
 if(occurs(r,origin)&&date<=last&&status(r,origin)!=='已取消'){
 let all=r.allDay==='是'||!r.start,start=origin===date&&r.start?parseMinutes(r.start):0,end=last===date?(r.end?parseMinutes(r.end):Math.min(1440,start+60)):1440;
 if(end>start||all)segments.push({r,origin,start,end:Math.max(start+1,end),all})
 }
 if(!base.repeat||base.repeat==='不重复')break
 }}
 const timed=segments.filter(x=>!x.all).sort((a,b)=>a.start-b.start);let active=[];
 for(const x of timed){active=active.filter(a=>a.end>x.start);if(active.length){x.conflict=true;active.forEach(a=>a.conflict=true)}active.push(x)}
 return segments
}
const hhmm=m=>m===1440?'24:00':String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
function block(x){const r=x.r;return '<button class="calblock kind-'+r.kind+'" data-a="'+(r.kind==='task'?'occurrence':'edit')+'" data-v="'+(r.kind==='task'?r.id+'|'+x.origin:r.id)+'" '+(['event','task'].includes(r.kind)?'draggable="true" data-moving="'+r.id+'" data-from="'+x.origin+'"':'')+'><small>'+esc(kinds[r.kind])+' · '+(x.all?'全天':hhmm(x.start)+'–'+hhmm(x.end))+(x.conflict?' · 重叠':'')+'</small>'+esc(r.title)+'</button>'}
function planner(){
 indexState();const types=S.prefs.calendarKinds||calendarKinds,filters='<details class="calfilter"><summary>显示内容</summary>'+calendarKinds.map(k=>'<label class="inline"><input type="checkbox" name="calKind" value="'+k+'" '+(types.includes(k)?'checked':'')+'>'+kinds[k]+'</label>').join('')+'<label class="inline"><input type="checkbox" name="almanac" '+(S.prefs.almanac!==false?'checked':'')+'>节日、节气与这一天</label></details>';
 const first=weekStart(cal==='月'?day.slice(0,7)+'-01':day),dates=cal==='日'?[day]:days(first,add(first,cal==='月'?41:6)),columns=dates.map(d=>calendarSegments(d,types)),labels=['一','二','三','四','五','六','日'];
 if(cal==='月')return filters+dayStory(day)+'<div class="calendar month">'+labels.map(t=>'<small>周'+t+'</small>').join('')+dates.map((d,i)=>'<div class="day '+(d===day?'active ':'')+(d===today()?'current':'')+'" data-a="date" data-v="'+d+'" data-dropday="'+d+'">'+btn(d.slice(8)+(d===today()?' 今':''),'date',d)+annotation(d)+columns[i].slice(0,2).map(x=>'<span draggable="'+['task','event'].includes(x.r.kind)+'" data-moving="'+x.r.id+'" data-from="'+x.origin+'" class="kind-'+x.r.kind+'">'+esc(kinds[x.r.kind])+' · '+esc(x.r.title)+'</span>').join('')+(columns[i].length>2?btn('另 '+(columns[i].length-2)+' 项','date',d):'')+'</div>').join('')+'</div>'+card(day,calendarSegments(day,types).map(x=>calItem(x.r,x.origin)).join('')||empty());
 const now=new Date(),minute=now.getHours()*60+now.getMinutes();
 return filters+dayStory(day)+'<div class="planner" style="--cols:'+dates.length+'"><div class="plannerhead"><small>全天</small>'+dates.map((d,i)=>'<div>'+btn(d.slice(5),'date',d)+annotation(d)+'<small>'+parse(d).toLocaleDateString('zh-CN',{weekday:'short'})+'</small>'+columns[i].filter(x=>x.all).map(block).join('')+'</div>').join('')+'</div><div class="scrollhours"><div class="hours"><div class="ruler">'+Array.from({length:24},(_,h)=>'<small>'+hhmm(h*60)+'</small>').join('')+'</div>'+dates.map((d,i)=>{
 const timed=columns[i].filter(x=>!x.all).sort((a,b)=>a.start-b.start);let ends=[],cluster=[];function finish(){cluster.forEach(x=>x.cols=ends.length);cluster=[];ends=[]}
 for(const x of timed){if(ends.every(e=>e<=x.start))finish();let lane=ends.findIndex(e=>e<=x.start);if(lane<0)lane=ends.length;ends[lane]=x.end;x.lane=lane;cluster.push(x)}finish();
 return '<div class="timecol">'+Array.from({length:24},(_,h)=>'<div class="hourdrop" data-dropday="'+d+'" data-hour="'+hhmm(h*60)+'"></div>').join('')+timed.map(x=>'<div class="timeblock" style="top:'+x.start/60*48+'px;height:'+Math.max(22,(x.end-x.start)/60*48)+'px;left:'+100*x.lane/x.cols+'%;width:'+100/x.cols+'%">'+block(x)+'</div>').join('')+(d===today()?'<div class="nowline" style="top:'+minute/60*48+'px" title="当前时间 '+hhmm(minute)+'"></div>':'')+'</div>'}).join('')+'</div></div></div>'
}

