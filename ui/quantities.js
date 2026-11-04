function habitMet(r,d){
 if(r.measure!=='数量')return marked(r.id,d)==='1';
 const entry=S.amounts.find(x=>x.item===r.id&&x.day===d);
 return !!entry&&entry.amount>=entry.target
}
function quantityRow(r,d){
 const entry=S.amounts.find(x=>x.item===r.id&&x.day===d);
 const label=entry?(entry.amount>=entry.target?'已达标':'已记录 · 未达标'):'尚未记录';
 return '<div class="row">'+btn(r.title,'edit',r.id)+'<small>'+label+' · '+(entry?.amount??0)+' / '+esc(entry?.target??r.target)+' '+esc(entry?.unit??r.unit)+'</small>'+btn('记录数量','quantity',r.id+'|'+d)+'</div>'
}
function quantityEditor(value){
 const [id,date]=value.split('|'),r=item(id),entry=S.amounts.find(x=>x.item===r.id&&x.day===date);
 modal('<form id="amountForm"><h2>'+esc(r.title)+'</h2><p>'+date+' · 当前 '+(entry?.amount??0)+' '+esc(entry?.unit??r.unit)+'</p><label>操作'+select('mode',[['add','追加到当天'],['set','改正当天合计']],'add')+'</label><label>数量<input name="amount" type="number" min="0" max="1000000000" step="0.000001" required></label><div class="foot"><button type="button" data-a="close">取消</button><button class="accent" type="submit">保存</button></div></form>');
 const form=dlg.querySelector('form'),save=form.querySelector('[type=submit]');
 form.onsubmit=async e=>{e.preventDefault();if(save.disabled)return;save.disabled=true;try{await A.amount(+id,date,form.elements.mode.value,form.elements.amount.valueAsNumber);dlg.close();await refresh();toast('已保存当天合计')}catch(err){toast(err.message)}finally{save.disabled=false}}
}
function quantityReport(a,b){
 const groups=new Map();
 for(const x of S.amounts){if(x.day<a||x.day>b)continue;const group=groups.get(x.unit)||{total:0,met:new Set()};group.total+=x.amount;if(x.amount>=x.target)group.met.add(x.day);groups.set(x.unit,group)}
 return groups.size?card('习惯投入',[...groups].map(([unit,g])=>'<p>'+Number(g.total.toFixed(6))+' '+esc(unit)+' · 达标 '+g.met.size+' 天</p>').join('')):''
}
