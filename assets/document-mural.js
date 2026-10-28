/* DELTA RPG — Mural de documentos, notas arrastáveis e pena animada */
(()=>{'use strict';
const KEY='delta-document-wall-v1'; // Legacy shared mural: retained as a backup.
const MIGRATION='delta-document-wall-legacy-migration-v2';
function init(){
 const nav=document.querySelector('.rpg-tabs');if(!nav)return;
 const bridge=window.DeltaRpgMuralBridge;if(!bridge)return;
 let button=nav.querySelector('[data-tab="mural"]');
 if(!button){button=document.createElement('button');button.type='button';button.className='rpg-tab';button.dataset.tab='mural';button.setAttribute('role','tab');button.setAttribute('aria-selected','false');button.textContent='✎ MURAL DE DOCUMENTOS';nav.append(button);}
 let panel=document.getElementById('tab-mural');
 if(!panel){panel=document.createElement('section');panel.id='tab-mural';panel.className='tab-content mural-tab';panel.hidden=true;nav.after(panel);}
 panel.innerHTML='<div class="mural-head"><div><span class="mural-kicker">✦ ARQUIVO DE MEMÓRIAS</span><h2>MURAL DE DOCUMENTOS</h2><span class="mural-current-file" id="muralCurrentFile"></span><p>Arraste os bilhetes, escreva suas histórias e organize o mural.</p></div><div class="mural-actions"><button type="button" id="muralAdd">+ BILHETE</button><button type="button" id="muralAddCard">▣ CARTÃO</button><button type="button" id="muralAddTicket">◇ ETIQUETA</button><button type="button" id="muralAddCircle">◉ FOTO CIRCULAR</button><button type="button" id="muralExport">↓ EXPORTAR</button><label class="mural-import">↑ IMPORTAR<input id="muralImport" type="file" accept=".json,application/json" hidden></label></div></div><div class="mural-board" id="muralBoard" aria-label="Mural de bilhetes arrastáveis"><div class="mural-grid"></div></div><p class="mural-foot">Cada FILE possui seu próprio mural. As notas acompanham a ficha nos salvamentos e exportações.</p>';
 nav.after(panel);
 const board=panel.querySelector('#muralBoard');
 const chalk=document.createElement('canvas');chalk.className='mural-chalk';chalk.setAttribute('aria-hidden','true');board.append(chalk);
 const cx=chalk.getContext('2d'),trails=[];let drawing=false,lastPoint=null,frameChalk=0;
 function resizeChalk(){const dpr=Math.min(2,devicePixelRatio||1);chalk.width=Math.max(1,Math.round(board.clientWidth*dpr));chalk.height=Math.max(1,Math.round(board.clientHeight*dpr));if(cx)cx.setTransform(dpr,0,0,dpr,0,0);}
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeChalk).observe(board);resizeChalk();
 function chalkPoint(e){const r=board.getBoundingClientRect(),sx=board.clientWidth/r.width,sy=board.clientHeight/r.height;return {x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};}
 function drawChalk(now){
  if(!cx)return;
  cx.clearRect(0,0,board.clientWidth,board.clientHeight);
  for(let i=trails.length-1;i>=0;i--){
   const seg=trails[i],alpha=Math.max(0,1-(now-seg.t)/2900);
   if(!alpha){trails.splice(i,1);continue;}
   cx.save();cx.strokeStyle='rgba(231,224,255,'+(alpha*.65)+')';cx.lineWidth=2.7;cx.lineCap='round';
   cx.beginPath();cx.moveTo(seg.a.x,seg.a.y);cx.lineTo(seg.b.x,seg.b.y);cx.stroke();
   cx.fillStyle='rgba(255,238,229,'+(alpha*.33)+')';
   for(let j=0;j<3;j++){const t=(j+.3)/3;const x=seg.a.x+(seg.b.x-seg.a.x)*t+(j-1)*2;
    const y=seg.a.y+(seg.b.y-seg.a.y)*t+(j%2?1.5:-1.5);cx.fillRect(x,y,1.5,1.5);}
   cx.restore();
  }
  if(trails.length||drawing)frameChalk=requestAnimationFrame(drawChalk);else frameChalk=0;
 }
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('.mural-note')||e.target.closest('button,textarea'))return;
  drawing=true;lastPoint=chalkPoint(e);board.setPointerCapture(e.pointerId);
  if(!frameChalk&&cx)frameChalk=requestAnimationFrame(drawChalk);
 });
 board.addEventListener('pointermove',e=>{
  if(!drawing||!lastPoint)return;
  const point=chalkPoint(e);if(Math.hypot(point.x-lastPoint.x,point.y-lastPoint.y)<1)return;
  trails.push({a:lastPoint,b:point,t:performance.now()});
  if(trails.length>1250)trails.splice(0,trails.length-1250);
  lastPoint=point;
 });
 const endChalk=()=>{drawing=false;lastPoint=null;};
 board.addEventListener('pointerup',endChalk);board.addEventListener('pointercancel',endChalk);

 const PINS=['classic','soul','star','eye'];
 const PIN_NAMES={classic:'Alfinete clássico',soul:'Coração da alma',star:'Broche estrela',eye:'Broche do olho'};
 const HEART='<svg viewBox="0 0 22 20" aria-hidden="true"><path fill="currentColor" d="M2 2h3V0h5v2h2V0h5v2h3v4h2v4h-2v2h-2v2h-2v2h-2v-2H8v-2H6v-2H4v-2H2v-2H0V6h2Z"/></svg>';
 let notes=[],currentFileId=null,z=1;
 function updateBrooch(element,pinKind){
  const type=PINS.includes(pinKind)?pinKind:'classic';
  element.dataset.pin=type;
  element.title=PIN_NAMES[type]+' · clique para trocar';
  element.setAttribute('aria-label',element.title);
  element.replaceChildren();
  element.style.color=bridge.soulColor?.(currentFileId)||'#ffd9ef';
  if(type==='soul')element.innerHTML=HEART;
  else if(type==='star'||type==='eye'){
   const img=document.createElement('img');
   img.alt='';img.draggable=false;
   img.src=type==='star'?'./assets/mural-pin-star.svg':'./assets/mural-pin-eye.svg';
   element.append(img);
  }else element.textContent='◆';
 }
 function refreshSoulPins(){
  panel.querySelectorAll('.mural-brooch[data-pin="soul"]').forEach(el=>
   el.style.color=bridge.soulColor?.(currentFileId)||'#ffd9ef');
 }
 function renderPhoto(stage,note){
  const image=stage.querySelector('img'),empty=stage.querySelector('.mural-photo-empty');
  const valid=typeof note.image==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/.test(note.image)&&note.image.length<=75000;
  image.hidden=!valid;empty.hidden=!!valid;
  if(valid){image.src=note.image;}else image.removeAttribute('src');
 }
 async function compressPhoto(file){
  if(!file||!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)||file.size>8e6)
   throw Error('Selecione uma imagem de até 8 MB (PNG, JPG, WebP, GIF ou AVIF).');
  const url=URL.createObjectURL(file),image=new Image();
  try{
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Não foi possível abrir a imagem.'));image.src=url;});
   let size=320,quality=.72,output='';
   for(let pass=0;pass<5;pass++){
    const w=Math.max(1,Math.round(image.naturalWidth*Math.min(1,size/image.naturalWidth,size/image.naturalHeight)));
    const h=Math.max(1,Math.round(image.naturalHeight*Math.min(1,size/image.naturalWidth,size/image.naturalHeight)));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível.');
    ctx.fillStyle='#f7f3ed';ctx.fillRect(0,0,w,h);
    ctx.drawImage(image,0,0,w,h);
    output=canvas.toDataURL('image/jpeg',quality);
    if(output.length<=70000)return output;
    size=Math.max(96,Math.round(size*.72));quality=Math.max(.42,quality-.09);
   }
   throw Error('A imagem é muito grande. Tente uma foto mais simples.');
  }finally{URL.revokeObjectURL(url)}
 }
 const save=owner=>{
  const id=owner||currentFileId;
  if(!id||id!==currentFileId)return false;
  return bridge.writeNotes(id,notes);
 };
 function migrateLegacyFile(){
  const id=bridge.activeFileId();
  if(!id||localStorage.getItem(MIGRATION))return;
  let old=[];
  try{old=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{}
  if(!Array.isArray(old)||old.length===0){
   localStorage.setItem(MIGRATION,JSON.stringify({fileId:null,migrated:false}));return;
  }
  // The old mural was shared by every FILE. Assign it once to the currently
  // selected FILE only and keep the previous storage key as a recovery copy.
  if(bridge.readNotes(id).length===0){
   if(bridge.writeNotes(id,old)){
    localStorage.setItem(MIGRATION,JSON.stringify({fileId:id,migrated:true}));
   }
  }else{
   // Do not overwrite the current FILE; the old mural remains untouched.
   localStorage.setItem(MIGRATION,JSON.stringify({fileId:null,migrated:false,legacyBackup:true}));
  }
 }
 const feather=document.createElement('div');feather.className='mural-feather';feather.setAttribute('aria-hidden','true');feather.innerHTML='<span>✒</span>';panel.append(feather);
 panel.addEventListener('pointermove',e=>{const r=panel.getBoundingClientRect();feather.style.left=(e.clientX-r.left)+'px';feather.style.top=(e.clientY-r.top)+'px';});
 panel.addEventListener('pointerleave',()=>feather.classList.remove('is-writing'));
 function add(note){
  const owner=currentFileId;
  const el=document.createElement('article');el.className='mural-note';el.dataset.id=note.id;
  el.style.left=note.x+'px';el.style.top=note.y+'px';el.style.zIndex=note.z||1;
  note.width=Math.max(180,Math.min(680,Number(note.width)||245));note.height=Math.max(150,Math.min(640,Number(note.height)||184));
  note.paper=['shadow','paper','blue','sage','rose','gold'].includes(note.paper)?note.paper:'shadow';
  note.kind=['note','card','ticket','circle'].includes(note.kind)?note.kind:'note';
  note.pin=PINS.includes(note.pin)?note.pin:'classic';
  el.style.width=note.width+'px';el.style.height=note.height+'px';el.dataset.paper=note.paper;
  el.dataset.kind=note.kind;
  el.innerHTML='<div class="mural-note-grab" title="Arraste para mover"><button class="mural-pin mural-brooch" type="button" title="Trocar broche" aria-label="Trocar broche">◆</button><span class="mural-drag-label">SEGURE PARA MOVER</span><button class="mural-paper-toggle" type="button" aria-label="Trocar fundo da nota" title="Trocar fundo da nota">◈</button><button class="mural-delete" type="button" aria-label="Excluir bilhete">×</button></div><textarea spellcheck="true" maxlength="3000" aria-label="Texto do bilhete" placeholder="* Você encontrou uma lembrança..."></textarea><div class="mural-note-bottom"><span>✦ TEXTO</span><span class="mural-counter">0/3000</span></div><div class="mural-resize-handles" aria-hidden="true"><i data-edge="n"></i><i data-edge="s"></i><i data-edge="e"></i><i data-edge="w"></i><i data-edge="nw"></i><i data-edge="ne"></i><i data-edge="sw"></i><i data-edge="se"></i></div>';
  const brooch=el.querySelector('.mural-brooch');
  updateBrooch(brooch,note.pin);
  brooch.addEventListener('click',()=>{
   if(owner!==currentFileId)return;
   note.pin=PINS[(PINS.indexOf(note.pin)+1)%PINS.length];
   updateBrooch(brooch,note.pin);save(owner);
  });
  if(note.kind==='circle'){
   const stage=document.createElement('div');stage.className='mural-image-stage';
   stage.innerHTML='<span class="mural-photo-empty">◉<small>ADICIONE UMA IMAGEM</small></span><img alt="Imagem circular do mural" draggable="false" hidden>';
   const button=document.createElement('button');button.className='mural-upload-photo';
   button.type='button';button.textContent='✦ ESCOLHER IMAGEM';
   const picker=document.createElement('input');picker.type='file';picker.accept='image/*';
   picker.hidden=true;picker.className='mural-photo-file';
   button.addEventListener('click',()=>picker.click());
   picker.addEventListener('change',async()=>{
    const file=picker.files?.[0];picker.value='';if(!file)return;
    try{
     const picture=await compressPhoto(file);
     if(owner!==currentFileId||!notes.includes(note))return;
     // Avoid oversized FILES and peer-to-peer messages.
     const total=notes.filter(x=>x!==note).reduce((n,x)=>n+(x.image?.length||0),0);
     if(total+picture.length>300000)throw Error('O mural chegou ao limite de imagens. Exporte o FILE antes de adicionar mais.');
     note.image=picture;renderPhoto(stage,note);save(owner);
    }catch(error){alert(error.message||'Falha ao importar imagem.');}
   });
   const textarea=el.querySelector('textarea');
   textarea.before(stage,button,picker);
   textarea.placeholder='Legenda da imagem...';
   textarea.maxLength=3000;
   renderPhoto(stage,note);
  }
  if(note.kind==='card')el.querySelector('textarea').placeholder='Escreva no cartão...';
  if(note.kind==='ticket')el.querySelector('textarea').placeholder='Título, pista ou lembrança...';
  const papers=['shadow','paper','blue','sage','rose','gold'];
  el.querySelector('.mural-paper-toggle').addEventListener('click',()=>{
   const idx=papers.indexOf(note.paper);note.paper=papers[(idx+1)%papers.length];
   el.dataset.paper=note.paper;save(owner);
  });
  for(const handle of el.querySelectorAll('.mural-resize-handles i')){
   let origin=null;const edge=handle.dataset.edge;
   handle.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    note.z=++z;el.style.zIndex=z;
    origin={x:e.clientX,y:e.clientY,left:note.x,top:note.y,width:note.width,height:note.height};
    handle.setPointerCapture(e.pointerId);el.classList.add('resizing');
   });
   handle.addEventListener('pointermove',e=>{
    if(!origin)return;
    const scale=board.getBoundingClientRect().width/board.clientWidth||1;
    const dx=(e.clientX-origin.x)/scale,dy=(e.clientY-origin.y)/scale;
    let x=origin.left,y=origin.top,w=origin.width,h=origin.height;
    if(edge.includes('e'))w=Math.max(180,Math.min(700,origin.width+dx));
    if(edge.includes('s'))h=Math.max(150,Math.min(700,origin.height+dy));
    if(edge.includes('w')){w=Math.max(180,Math.min(700,origin.width-dx));x=origin.left+origin.width-w;}
    if(edge.includes('n')){h=Math.max(150,Math.min(700,origin.height-dy));y=origin.top+origin.height-h;}
    x=Math.max(0,x);y=Math.max(0,y);
    w=Math.min(w,Math.max(180,board.clientWidth-x-5));
    h=Math.min(h,Math.max(150,board.clientHeight-y-5));
    note.x=Math.round(x);note.y=Math.round(y);
    note.width=Math.round(w);note.height=Math.round(h);
    el.style.left=note.x+'px';el.style.top=note.y+'px';
    el.style.width=note.width+'px';el.style.height=note.height+'px';
   });
   const done=()=>{if(!origin)return;origin=null;el.classList.remove('resizing');save(owner);};
   handle.addEventListener('pointerup',done);handle.addEventListener('pointercancel',done);
  }
  const input=el.querySelector('textarea');input.value=note.text||'';
  const counter=el.querySelector('.mural-counter');counter.textContent=input.value.length+'/3000';
  input.addEventListener('input',()=>{note.text=input.value;counter.textContent=input.value.length+'/3000';feather.classList.remove('is-writing');void feather.offsetWidth;feather.classList.add('is-writing');save(owner);});
  el.querySelector('.mural-delete').addEventListener('click',()=>{if(owner!==currentFileId||!confirm('Excluir este bilhete?'))return;notes=notes.filter(n=>n.id!==note.id);el.remove();save(owner);});
  const grab=el.querySelector('.mural-note-grab');let start=null;
  let tilt=0,velocity=0,frame=0,lastX=0,lastY=0;
  function animateTilt(){
   const target=start?Math.max(-12,Math.min(12,velocity*1.45)):0;
   velocity*=.76;
   tilt+=(target-tilt)*(start?.22:.11);
   el.style.setProperty('--note-tilt',tilt.toFixed(2)+'deg');
   if(start||Math.abs(tilt)>.12||Math.abs(velocity)>.12)frame=requestAnimationFrame(animateTilt);
   else{el.style.setProperty('--note-tilt','0deg');frame=0;}
  }
  grab.addEventListener('pointerdown',e=>{
   if(e.target.closest('button'))return;
   e.preventDefault();start={px:e.clientX,py:e.clientY,x:note.x,y:note.y};
   lastX=e.clientX;lastY=e.clientY;velocity=0;note.z=++z;el.style.zIndex=z;
   grab.setPointerCapture(e.pointerId);el.classList.add('dragging');
   if(!frame)frame=requestAnimationFrame(animateTilt);
  });
  grab.addEventListener('pointermove',e=>{
   if(!start)return;
   const dx=e.clientX-lastX,dy=e.clientY-lastY;
   lastX=e.clientX;lastY=e.clientY;
   velocity=Math.max(-9,Math.min(9,velocity*.55+dx*.45+dy*.07));
   const scale=board.getBoundingClientRect().width/board.clientWidth||1;
   note.x=Math.max(0,Math.min(board.clientWidth-el.offsetWidth,start.x+(e.clientX-start.px)/scale));
   note.y=Math.max(0,Math.min(board.clientHeight-el.offsetHeight,start.y+(e.clientY-start.py)/scale));
   el.style.left=note.x+'px';el.style.top=note.y+'px';
  });
  const stop=()=>{
   if(start){start=null;velocity=0;el.classList.remove('dragging');
    el.classList.remove('note-settle');void el.offsetWidth;el.classList.add('note-settle');
    setTimeout(()=>el.classList.remove('note-settle'),700);save(owner);}
  };
  grab.addEventListener('pointerup',stop);grab.addEventListener('pointercancel',stop);
  el.addEventListener('pointerdown',()=>{note.z=++z;el.style.zIndex=z;});
  board.append(el);
 }
 function refreshNotes(force=false){
  const id=bridge.activeFileId();
  const label=window.DeltaRpgLiveBridge?.readFile?.(id)?.label;
  const fileIndicator=panel.querySelector('#muralCurrentFile');
  if(fileIndicator)fileIndicator.textContent=id?'✦ FILE ATIVO · '+(label||'PERSONAGEM'):'NENHUM FILE ABERTO';
  const incoming=id?bridge.readNotes(id):[];
  if(!force&&id===currentFileId&&JSON.stringify(incoming)===JSON.stringify(notes))return;
  currentFileId=id;
  notes=incoming;
  z=Math.max(1,...notes.map(n=>n.z||1));
  board.querySelectorAll('.mural-note').forEach(el=>el.remove());
  trails.length=0;drawing=false;lastPoint=null;
  notes.forEach(add);
  refreshSoulPins();
 }
 migrateLegacyFile();
 refreshNotes(true);
 window.addEventListener('delta-rpg:file-changed',()=>refreshNotes());
 window.addEventListener('delta-rpg:mural-refresh',e=>{
  if(e.detail?.fileId===bridge.activeFileId())refreshNotes();
 });
 window.addEventListener('delta-rpg:save',e=>{
  if(e.detail?.fileId===bridge.activeFileId()){
   refreshNotes();refreshSoulPins();
  }
 });
 function create(kind='note'){
  if(!currentFileId)return;
  const i=notes.length;
  const size={note:[245,184],card:[305,220],ticket:[285,190],circle:[280,320]}[kind]||[245,184];
  const n={id:'n'+Date.now()+Math.random().toString(36).slice(2,7),text:'',
   x:Math.min(40+(i%4)*48,Math.max(0,board.clientWidth-size[0]-15)),
   y:40+Math.floor(i/4)*50,z:++z,width:size[0],height:size[1],
   paper:kind==='circle'?'paper':kind==='ticket'?'gold':'shadow',kind,
   pin:'soul',image:''};
  notes.push(n);add(n);save(currentFileId);
  board.querySelector('[data-id="'+n.id+'"] textarea')?.focus();
 }
 panel.querySelector('#muralAdd').addEventListener('click',()=>create('note'));
 panel.querySelector('#muralAddCard').addEventListener('click',()=>create('card'));
 panel.querySelector('#muralAddTicket').addEventListener('click',()=>create('ticket'));
 panel.querySelector('#muralAddCircle').addEventListener('click',()=>create('circle'));
 panel.querySelector('#muralExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:2,app:'DELTA RPG',fileId:currentFileId,notes},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mural-documentos.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 panel.querySelector('#muralImport').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.notes))throw Error();if(!confirm('Substituir o mural atual pelo arquivo importado?'))return;notes=d.notes.filter(n=>n&&typeof n.text==='string'&&Number.isFinite(n.x)&&Number.isFinite(n.y)).slice(0,150);board.querySelectorAll('.mural-note').forEach(el=>el.remove());notes.forEach(add);save(currentFileId);}catch{alert('Arquivo de mural inválido.')}e.target.value='';});
 // Reutiliza a lógica original de abas do site; se necessário sincroniza manualmente.
 button.addEventListener('click',()=>{refreshNotes();document.querySelectorAll('.rpg-tab').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));});document.querySelectorAll('.tab-content').forEach(s=>{s.hidden=s!==panel;s.classList.toggle('active',s===panel);});});
 nav.querySelectorAll('.rpg-tab:not([data-tab="mural"])').forEach(b=>b.addEventListener('click',()=>{panel.hidden=true;panel.classList.remove('active');button.classList.remove('active');button.setAttribute('aria-selected','false');}));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();