/* DELTA RPG: arquivo secreto dos humanos. Artes originais do usuário, história pendente. */
(()=>{
 'use strict';
 if(window.__deltaPastHumansLoaded)return;
 window.__deltaPastHumansLoaded=true;
 const people=[
  {id:'warrior',name:'O Guerreiro',tone:'#df6482',roman:'I'},
  {id:'sorceress',name:'A Feiticeira',tone:'#efcbd3',roman:'II'},
  {id:'squire',name:'O Escudeiro',tone:'#8cc9ff',roman:'III'},
  {id:'alchemist',name:'O Alquimista',tone:'#ffb47b',roman:'IV'}
 ];
 const heart=document.querySelector('.portrait .soul-wrap');
 if(!heart)return;
 const dialog=document.createElement('dialog');
 dialog.id='deltaPastHumans';
 dialog.className='delta-past-dialog';
 dialog.setAttribute('aria-label','Memórias dos humanos do passado');
 dialog.innerHTML =
  '<div class="delta-past-shell">'+
  '<div class="delta-past-transition" aria-hidden="true"><span class="delta-past-sigil">✦</span><span class="delta-past-orbit"></span></div>'+
  '<header class="delta-past-header"><span aria-hidden="true">✧　✦　✧</span><button type="button" class="delta-past-close" aria-label="Fechar">×</button></header>'+
  '<div class="delta-past-rule" aria-hidden="true">✧</div>'+
  '<section class="delta-past-gallery" aria-label="Selecionar uma flor"><div class="delta-past-grid"></div></section>'+
  '<section class="delta-past-detail" aria-label="Visualização de uma memória" hidden><button class="delta-past-back" type="button" aria-label="Voltar às flores">‹</button>'+
  '<div class="delta-past-detail-frame"><span id="deltaPastDetailFlower" class="delta-past-flower" aria-hidden="true"></span></div>'+
  '<h2 id="deltaPastDetailTitle"></h2><div class="delta-past-placeholder" aria-hidden="true"><i></i><i></i><i></i></div></section>'+
  '<footer class="delta-past-footer" aria-hidden="true">✧　◇　✦　◇　✧</footer></div>';
 document.body.appendChild(dialog);
 const gallery=dialog.querySelector('.delta-past-gallery');
 const detail=dialog.querySelector('.delta-past-detail');
 const grid=dialog.querySelector('.delta-past-grid');
 const close=dialog.querySelector('.delta-past-close');
 let taps=0,lastTap=0;
 function showGallery(){gallery.hidden=false;detail.hidden=true;}
 function showPerson(person){
  gallery.hidden=true;detail.hidden=false;
  detail.style.setProperty('--delta-past-accent',person.tone);
  dialog.querySelector('#deltaPastDetailFlower').className='delta-past-flower delta-past-'+person.id;
  dialog.querySelector('#deltaPastDetailTitle').textContent=person.name;
  detail.classList.remove('delta-past-enter');void detail.offsetWidth;detail.classList.add('delta-past-enter');
  dialog.querySelector('.delta-past-back').focus({preventScroll:true});
 }
 people.forEach(person=>{
  const card=document.createElement('button');card.type='button';
  card.className='delta-past-card';card.style.setProperty('--delta-past-accent',person.tone);
  card.setAttribute('aria-label',person.name);
  const ornament=document.createElement('span');ornament.className='delta-past-card-symbol';ornament.textContent='✧';ornament.setAttribute('aria-hidden','true');
  const art=document.createElement('span');art.className='delta-past-card-art';
  const flower=document.createElement('span');flower.className='delta-past-flower delta-past-'+person.id;flower.setAttribute('aria-hidden','true');
  art.append(flower);
  const title=document.createElement('span');title.className='delta-past-card-name';title.textContent=person.name;
  const numeral=document.createElement('span');numeral.className='delta-past-numeral';numeral.textContent=person.roman;numeral.setAttribute('aria-hidden','true');
  card.append(ornament,art,numeral,title);
  card.addEventListener('click',()=>showPerson(person));grid.append(card);
 });
 function open(){
  taps=0;lastTap=0;showGallery();
  if(!dialog.open)dialog.showModal();
  dialog.classList.remove('delta-past-opening');void dialog.offsetWidth;dialog.classList.add('delta-past-opening');
  close.focus({preventScroll:true});
 }
 function beat(){
  if(dialog.open)return;
  const now=performance.now();if(now-lastTap>5000)taps=0;
  lastTap=now;taps++;
  if(taps>=5)open();
 }
 heart.setAttribute('role','button');heart.setAttribute('tabindex','0');
 heart.setAttribute('aria-label','Alma do personagem');
 heart.addEventListener('click',beat);
 heart.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();beat();}
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.querySelector('.delta-past-back').addEventListener('click',()=>{
  showGallery();grid.querySelector('button')?.focus({preventScroll:true});
 });
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{dialog.classList.remove('delta-past-opening');heart.focus({preventScroll:true});});
})();