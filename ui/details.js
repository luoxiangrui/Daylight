function journalBody(r){
 return (r.notes||'').split('\n').map(line=>{
 let html=esc(line).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 return line.startsWith('# ')?'<h3>'+html.slice(2)+'</h3>':'<div>'+html+'<br></div>';
 }).join('')
}
function journalTools(){return '<div class="toolbar wide">'+btn('标题','format','# ')+btn('粗体','format','**')+btn('斜体','format','*')+btn('排版预览','preview')+'</div>'}
function taskSteps(r){let steps=(r.subtasks||'').split('\n').map(s=>s.trim()).filter(Boolean);
 return steps.length?card('子任务',steps.map((s,i)=>btn((r.checkedSteps?.includes(s)?'✓ ':'○ ')+s,'step',r.id+'|'+i)).join('')):''}
function learningDetail(r){let logs=records('log').filter(l=>l.plan===r.id),minutes=logs.reduce((n,l)=>n+(+l.minutes||0),0),pct=r.minutes?Math.min(100,Math.round(minutes*100/r.minutes)):0;return '<div class="row"><button class="record" data-a="edit" data-v="'+r.id+'">'+esc(r.title)+'</button><small>'+minutes+' / '+(+r.minutes||0)+' 分钟</small></div><progress max="100" value="'+pct+'"></progress>'}
function learningStreak(){let ds=new Set(records('log').map(r=>r.date)),count=0;for(let d=ds.has(today())?today():add(today(),-1);ds.has(d);d=add(d,-1))count++;return count}
function journalPictures(r){return S.files.filter(f=>f.item===r.id&&/\.(png|jpeg|jpg|webp|gif)$/i.test(f.name)).map(f=>'<img data-photo="'+f.id+'" alt="'+esc(f.name)+'" style="max-width:100%;max-height:260px;border-radius:8px">').join('')}
async function loadPhotos(){for(let img of document.querySelectorAll('[data-photo]')){let uri=await A.photo(+img.dataset.photo,img.hasAttribute('data-staged'));if(uri)img.src=uri}}

