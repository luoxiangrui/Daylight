const pages={home:'首页',today:'今日',calendar:'日历',journal:'日记',learning:'学习',goals:'目标',habits:'习惯',moments:'纪念日',insights:'回顾',settings:'设置'};
const kinds={task:'任务',event:'日历事件',journal:'日记',plan:'学习计划',log:'学习记录',achievement:'学习成果',goal:'目标',milestone:'里程碑',habit:'习惯',moment:'纪念日'};
const layouts={
 task:'status priority start end endDate category tags subtasks repeat remind advance goal notes',event:'start end endDate allDay category color repeat remind advance task notes',
 journal:'start mood weather category tags important notes',plan:'subject endDate minutes daily stages goal remind advance notes',
 log:'subject minutes progress plan goal content problems summary notes',achievement:'category subject plan goal notes',
 goal:'level endDate category progress mode standard goal remind advance notes',milestone:'goal status notes',
 habit:'icon category frequency quantity remind notes',moment:'category person repeat remind advance notes'};
for(const k of Object.keys(layouts))if(!layouts[k].split(' ').includes('tags'))layouts[k]+=' tags';
for(const name of Object.keys(layouts))if(!layouts[name].split(' ').includes('tags'))layouts[name]+=' tags';
const labels={title:'名称',date:'日期',start:'开始时间',end:'结束时间',endDate:'结束 / 截止日期',allDay:'全天事件',category:'分类',color:'标记颜色',repeat:'重复',remind:'提醒时间',advance:'提前分钟',task:'关联任务',notes:'正文 / 备注',status:'状态',priority:'优先级',tags:'标签',subtasks:'子任务（每行一项）',goal:'上级 / 关联目标',mood:'心情',weather:'天气',important:'重要标记',subject:'科目',minutes:'时长（分钟）',daily:'每日学习任务',stages:'阶段计划',progress:'进度（%）',plan:'关联学习计划',content:'学习内容',problems:'遇到的问题',summary:'个人总结',level:'目标周期',mode:'进度方式',standard:'完成标准',icon:'图标',frequency:'目标频率',quantity:'每日目标量 / 时长',person:'关联人物'};
const choices={status:['待完成','进行中','已完成','已取消'],priority:['中','高','低'],repeat:['不重复','每天','每周','每月','每年'],mood:['平静','开心','充实','放松','踏实','满足','期待','兴奋','感动','好奇','想念','惆怅','孤单','失落','低落','委屈','烦躁','生气','紧张','焦虑','疲惫','说不清'],important:['普通','重要'],level:['短期','中期','长期'],mode:['手动','关联任务'],allDay:['否','是'],frequency:['每天','工作日','周末']};
const cardNames={task:'今日计划',plan:'学习进度',journal:'最近手记',goal:'进行中的目标',habit:'今日习惯',moment:'即将到来的纪念日',week:'未来七天',summary:'本周概览'};
const {key,parse,add,diff,occurs,today}=Dates;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weekStart=d=>add(d,-((parse(d).getDay()+6)%7));
function scheduled(r,d){return occurs(r,d)||(r.kind==='event'&&r.endDate&&d>=r.date&&d<=r.endDate)}
function nextDate(r,d){if(r.date>=d)return r.date;if(r.repeat!=='每年')return null;for(let year=+d.slice(0,4);year<=+d.slice(0,4)+8;year++){let s=year+r.date.slice(4);if(s>=d&&key(parse(s))===s)return s}return null}
function habitDue(r,d){let w=parse(d).getDay();return d>=r.date&&(r.frequency==='工作日'?w>0&&w<6:r.frequency==='周末'?w===0||w===6:true)}

