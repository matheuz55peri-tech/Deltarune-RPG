/* DELTA RPG — Mural de documentos, notas arrastáveis e pena animada */
(()=>{'use strict';
const KEY='delta-document-wall-v1';
function init(){
 const nav=document.querySelector('.rpg-tabs');if(!nav||document.getElementById('tab-mural'))return;
 const button=document.createElement('button');button.type='button';button.className='rpg-tab';button.dataset.tab='mural';button.setAttribute('role','tab');button.setAttribute('aria-selected','false');button.textContent='✎ MURAL DE DOCUMENTOS';nav.append(button);
 const panel=document.createElement('section');panel.id='tab-mural';panel.className='tab-content mural-tab';panel.hidden=true;
 panel.innerHTML='<div class="mural-head"><div><span class="mural-kicker">✦ ARQUIVO DE MEMÓRIAS</span><h2>MURAL DE DOCUMENTOS</h2><p>Arraste os bilhetes, escreva suas histórias e organize o mural.</p></div><div class="mural-actions"><button type="button" id="muralAdd">+ NOVO BILHETE</button><button type="button" id="muralExport">↓ EXPORTAR</button><label class="mural-import">↑ IMPORTAR<input id="muralImport" type="file" accept=".json,application/json" hidden></label></div></div><div class="mural-board" id="muralBoard" aria-label="Mural de bilhetes arrastáveis"><div class="mural-grid"></div></div><p class="mural-foot">Os bilhetes são salvos automaticamente neste navegador.</p>';
 nav.after(panel);
 const board=panel.querySelector('#muralBoard');
 let notes=[];try{notes=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(notes))notes=[];}catch{}
 let z=Math.max(1,...notes.map(n=>n.z||1));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(notes))}catch{}};
 const feather=document.createElement('div');feather.className='mural-feather';feather.setAttribute('aria-hidden','true');feather.innerHTML='<span>✒</span>';panel.append(feather);
 panel.addEventListener('pointermove',e=>{const r=panel.getBoundingClientRect();feather.style.left=(e.clientX-r.left)+'px';feather.style.top=(e.clientY-r.top)+'px';});
 panel.addEventListener('pointerleave',()=>feather.classList.remove('is-writing'));
 function add(note){
  const el=document.createElement('article');el.className='mural-note';el.dataset.id=note.id;
  el.style.left=note.x+'px';el.style.top=note.y+'px';el.style.zIndex=note.z||1;
  el.innerHTML='<div class="mural-note-grab" title="Arraste para mover"><span class="mural-pin">◆</span><span class="mural-drag-label">SEGURE PARA MOVER</span><button class="mural-delete" type="button" aria-label="Excluir bilhete">×</button></div><textarea spellcheck="true" maxlength="3000" aria-label="Texto do bilhete" placeholder="* Você encontrou uma lembrança..."></textarea><div class="mural-note-bottom"><span>✦ TEXTO</span><span class="mural-counter">0/3000</span></div>';
  const input=el.querySelector('textarea');input.value=note.text||'';
  const counter=el.querySelector('.mural-counter');counter.textContent=input.value.length+'/3000';
  input.addEventListener('input',()=>{note.text=input.value;counter.textContent=input.value.length+'/3000';feather.classList.remove('is-writing');void feather.offsetWidth;feather.classList.add('is-writing');save();});
  el.querySelector('.mural-delete').addEventListener('click',()=>{if(!confirm('Excluir este bilhete?'))return;notes=notes.filter(n=>n.id!==note.id);el.remove();save();});
  const grab=el.querySelector('.mural-note-grab');let start=null;
  grab.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();start={px:e.clientX,py:e.clientY,x:note.x,y:note.y};note.z=++z;el.style.zIndex=z;grab.setPointerCapture(e.pointerId);el.classList.add('dragging');});
  grab.addEventListener('pointermove',e=>{if(!start)return;const scale=board.getBoundingClientRect().width/board.clientWidth||1;note.x=Math.max(0,Math.min(board.clientWidth-el.offsetWidth,start.x+(e.clientX-start.px)/scale));note.y=Math.max(0,Math.min(board.clientHeight-el.offsetHeight,start.y+(e.clientY-start.py)/scale));el.style.left=note.x+'px';el.style.top=note.y+'px';});
  const stop=()=>{if(start){start=null;el.classList.remove('dragging');save();}};grab.addEventListener('pointerup',stop);grab.addEventListener('pointercancel',stop);
  board.append(el);
 }
 notes.forEach(add);
 function create(){const i=notes.length;const n={id:'n'+Date.now()+Math.random().toString(36).slice(2,7),text:'',x:Math.min(40+(i%4)*48,Math.max(0,board.clientWidth-260)),y:40+Math.floor(i/4)*50,z:++z};notes.push(n);add(n);save();board.querySelector('[data-id="'+n.id+'"] textarea').focus();}
 panel.querySelector('#muralAdd').addEventListener('click',create);
 panel.querySelector('#muralExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,notes},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mural-documentos.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 panel.querySelector('#muralImport').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.notes))throw Error();if(!confirm('Substituir o mural atual pelo arquivo importado?'))return;notes=d.notes.filter(n=>n&&typeof n.text==='string'&&Number.isFinite(n.x)&&Number.isFinite(n.y)).slice(0,150);board.querySelectorAll('.mural-note').forEach(el=>el.remove());notes.forEach(add);save();}catch{alert('Arquivo de mural inválido.')}e.target.value='';});
 // Reutiliza a lógica original de abas do site; se necessário sincroniza manualmente.
 button.addEventListener('click',()=>{document.querySelectorAll('.rpg-tab').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));});document.querySelectorAll('.tab-content').forEach(s=>{s.hidden=s!==panel;s.classList.toggle('active',s===panel);});});
 nav.querySelectorAll('.rpg-tab:not([data-tab="mural"])').forEach(b=>b.addEventListener('click',()=>{panel.hidden=true;panel.classList.remove('active');button.classList.remove('active');button.setAttribute('aria-selected','false');}));
 if(!notes.length)create();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();