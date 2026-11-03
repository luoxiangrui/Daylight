const Dates=(()=>{
 const key=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const parse=s=>new Date(s+'T12:00:00');
 const add=(s,n)=>{let d=parse(s);d.setDate(d.getDate()+n);return key(d)};
 const diff=(a,b)=>Math.round((parse(a)-parse(b))/86400000);
 function occurs(r,s){if(s<r.date)return false;if(r.kind==='plan')return s<=(r.endDate||r.date);if(r.kind==='goal')return s===(r.endDate||r.date);if(s===r.date)return true;switch(r.repeat){case '每天':return true;case '每周':return diff(s,r.date)%7===0;case '每月':return s.slice(8)===r.date.slice(8);case '每年':return s.slice(5)===r.date.slice(5);default:return false}}
 function taskVersion(r,date,editions){if(r.kind!=='task'||!r.repeat||r.repeat==='不重复')return r;
  const changes=editions.filter(e=>e.item===r.id&&e.day<=date);
  let result={...r};for(const e of changes)if(e.scope==='future')Object.assign(result,e.data);
  const single=changes.find(e=>e.scope==='day'&&e.day===date);return Object.assign(result,single?.data,{id:r.id})
 }
 return {key,parse,add,diff,occurs,taskVersion,today:()=>key(new Date())}
})();if(typeof module!=='undefined')module.exports=Dates;
