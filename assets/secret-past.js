/* DELTA RPG — arquivo secreto dos humanos do passado (v2).
   As imagens enviadas pelo usuário são a única arte dos personagens e das flores.
   Texto de história reservado para uma atualização futura. */
(()=>{
 'use strict';
 if(window.__deltaPastHumansLoaded)return;
 window.__deltaPastHumansLoaded=true;
 const people=[
  {id:'warrior',name:'O Guerreiro',tone:'#eb667e',roman:'I',portrait:'warrior'},
  {id:'sorceress',name:'A Feiticeira',tone:'#f3c6d8',roman:'II',portrait:'sorceress'},
  {id:'squire',name:'O Escudeiro',tone:'#8bc9ff',roman:'III'},
  {id:'alchemist',name:'O Alquimista',tone:'#f7b877',roman:'IV'},
  {id:'oculus',name:'O Oculus',tone:'#72bfb6',roman:'V',portrait:'oculus'},
  {id:'guide',name:'A Guia',tone:'#d88dba',roman:'VI'},
  {id:'priest',name:'O Sacerdote',tone:'#91d8e8',roman:'VII',portrait:'priest'},
  {id:'mundane',name:'O Mundano',tone:'#d98ce8',roman:'VIII',portrait:'mundane'},
  {id:'sorcerer',name:'O Feiticeiro',tone:'#ff948d',roman:'IX',portrait:'sorcerer'}
 ];
 const heart=document.querySelector('.portrait .soul-wrap');
 if(!heart)return;
 const dialog=document.createElement('dialog');
 dialog.id='deltaPastHumans';dialog.className='delta-past-dialog';
 dialog.setAttribute('aria-label','Memórias dos humanos do passado');
 dialog.innerHTML=
  '<div class="delta-past-shell">'+
  '<div class="delta-past-transition" aria-hidden="true"><span class="delta-past-sigil">✦</span><span class="delta-past-orbit"></span></div>'+
  '<header class="delta-past-header"><span aria-hidden="true">✧　✦　✧</span><button type="button" class="delta-past-close" aria-label="Fechar">×</button></header>'+
  '<div class="delta-past-rule" aria-hidden="true">✧</div>'+
  '<section class="delta-past-gallery" aria-label="Selecionar uma memória"><div class="delta-past-grid"></div></section>'+
  '<section class="delta-past-detail" aria-label="Visualização de uma memória" hidden>'+
    '<button class="delta-past-back" type="button" aria-label="Voltar às flores">‹</button>'+
    '<div class="delta-past-detail-frame"><span id="deltaPastDetailFlower" class="delta-past-flower" aria-hidden="true"></span></div>'+
    '<h2 id="deltaPastDetailTitle"></h2>'+
    '<div class="delta-past-placeholder" aria-hidden="true"><i></i><i></i><i></i></div>'+
  '</section>'+
  '<footer class="delta-past-footer" aria-hidden="true">✧　◇　✦　◇　✧</footer>'+
  '</div>';
 document.body.appendChild(dialog);
 const gallery=dialog.querySelector('.delta-past-gallery');
 const detail=dialog.querySelector('.delta-past-detail');
 const grid=dialog.querySelector('.delta-past-grid');
 const close=dialog.querySelector('.delta-past-close');
 const back=dialog.querySelector('.delta-past-back');
 let taps=0,lastTap=0,returnCard=null;
 function showGallery(){
  gallery.hidden=false;detail.hidden=true;
  detail.removeAttribute('data-portrait');
 }
 function showPerson(person,card){
  returnCard=card||null;
  gallery.hidden=true;detail.hidden=false;
  detail.style.setProperty('--delta-past-accent',person.tone);
  if(person.portrait)detail.dataset.portrait=person.portrait;
  else detail.removeAttribute('data-portrait');
  const visual=dialog.querySelector('#deltaPastDetailFlower');
  visual.className=person.id==='sorcerer'?'delta-past-crest-art':'delta-past-flower delta-past-'+person.id;
  visual.textContent=person.id==='sorcerer'?'✦':'';
  dialog.querySelector('#deltaPastDetailTitle').textContent=person.name;
  detail.classList.remove('delta-past-enter');
  void detail.offsetWidth;
  detail.classList.add('delta-past-enter');
  back.focus({preventScroll:true});
 }
 people.forEach(person=>{
  const card=document.createElement('button');card.type='button';
  card.className='delta-past-card';
  card.style.setProperty('--delta-past-accent',person.tone);
  card.setAttribute('aria-label',person.name);
  if(person.portrait)card.dataset.portrait=person.portrait;
  const ornament=document.createElement('span');ornament.className='delta-past-card-symbol';
  ornament.textContent='✧';ornament.setAttribute('aria-hidden','true');
  const art=document.createElement('span');art.className='delta-past-card-art';
  const flower=document.createElement('span');
  if(person.id==='sorcerer'){
   flower.className='delta-past-crest-art';
   flower.textContent='✦';
  } else flower.className='delta-past-flower delta-past-'+person.id;
  flower.setAttribute('aria-hidden','true');
  art.append(flower);
  const numeral=document.createElement('span');numeral.className='delta-past-numeral';
  numeral.textContent=person.roman;numeral.setAttribute('aria-hidden','true');
  const title=document.createElement('span');title.className='delta-past-card-name';title.textContent=person.name;
  card.append(ornament,art,numeral,title);
  card.addEventListener('click',()=>showPerson(person,card));
  grid.append(card);
 });
 function open(){
  taps=0;lastTap=0;returnCard=null;showGallery();
  if(!dialog.open)dialog.showModal();
  dialog.classList.remove('delta-past-opening');
  void dialog.offsetWidth;
  dialog.classList.add('delta-past-opening');
  close.focus({preventScroll:true});
 }
 function beat(){
  if(dialog.open)return;
  const now=performance.now();if(now-lastTap>5000)taps=0;
  lastTap=now;taps++;
  if(taps>=5)open();
 }
 heart.setAttribute('role','button');
 heart.setAttribute('tabindex','0');
 heart.setAttribute('aria-label','Alma do personagem');
 heart.addEventListener('click',beat);
 heart.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();beat();}
 });
 close.addEventListener('click',()=>dialog.close());
 back.addEventListener('click',()=>{
  showGallery();
  (returnCard||grid.querySelector('button'))?.focus({preventScroll:true});
 });
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{
  dialog.classList.remove('delta-past-opening');
  heart.focus({preventScroll:true});
 });
})();