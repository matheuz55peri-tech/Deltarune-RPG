/* DELTA RPG — arquivo secreto dos humanos do passado (v7).
   As imagens enviadas pelo usuário são a única arte dos personagens e das flores.
   As nove memórias exibem os destinos de seus personagens. */
(()=>{
 'use strict';
 if(window.__deltaPastHumansLoaded)return;
 window.__deltaPastHumansLoaded=true;
 const people=[
  {id:'warrior',name:'O Guerreiro',tone:'#eb667e',roman:'I',portrait:'warrior',story:"Segundo a profecia, seria o último a cair pelas mãos da rainha. Porém, acabou sendo lançado ao vazio, onde surge a escuridão."},
  {id:'sorceress',name:'A Feiticeira',tone:'#f3c6d8',roman:'II',portrait:'sorceress',story:"Segundo a profecia, ela enfrentaria diretamente a rainha, e esse confronto resultaria na vitória do grupo. Infelizmente, foi assassinada pelo Feiticeiro em um ato de loucura."},
  {id:'squire',name:'O Escudeiro',tone:'#8bc9ff',roman:'III',story:"Segundo a profecia, ele se tornaria um Revenant, mas foi decapitado em batalha por #####."},
  {id:'alchemist',name:'O Alquimista',tone:'#f7b877',roman:'IV',story:"Segundo a profecia, ele descobriu uma maneira de fazer seus inimigos esquecerem acontecimentos, mas foi torturado pela rainha, que desejava obter seus conhecimentos."},
  {id:'oculus',name:'O Oculus',tone:'#72bfb6',roman:'V',portrait:'oculus',story:"Segundo a profecia, ele enfrentaria Phikova diretamente. Nunca mais foi encontrado após essa batalha."},
  {id:'guide',name:'A Guia',tone:'#d88dba',roman:'VI',story:"Segundo a profecia, ela deveria guiar seu grupo até a grande catedral, onde revelaria o verdadeiro objetivo de todos. Infelizmente, uma Fonte foi aberta em seu corpo."},
  {id:'priest',name:'O Sacerdote',tone:'#91d8e8',roman:'VII',portrait:'priest',story:"Segundo a profecia, morreria pelo bem maior. Foi evaporado ao ser engolido por um titã."},
  {id:'mundane',name:'O Mundano',tone:'#d98ce8',roman:'VIII',portrait:'mundane',story:"Segundo a profecia, um monstro do Mundo da Luz ajudaria os heróis a alcançar a vitória. No entanto, a rainha o aprisionou na camada mais profunda, onde nenhuma cidade jamais chegou."},
  {id:'sorcerer',name:'O Feiticeiro',tone:'#ff948d',roman:'IX',portrait:'sorcerer',story:"Segundo a profecia, ele seria responsável pela vitória dos heróis. Infelizmente, sua mente se corrompeu, e ele abandonou o grupo e seu objetivo."}
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
    '<div class="delta-past-ambient" aria-hidden="true"></div>'+
    '<div class="delta-past-story-layout">'+
       '<div class="delta-past-story-visual">'+
         '<div class="delta-past-hero-glow" aria-hidden="true"></div>'+
         '<div class="delta-past-hero-halo" aria-hidden="true"></div>'+
         '<div class="delta-past-hero-echo" aria-hidden="true"></div>'+
         '<div class="delta-past-hero-portrait" aria-hidden="true"></div>'+
         '<div class="delta-past-hero-rune" aria-hidden="true">✧</div>'+
         '<div class="delta-past-detail-frame"><span id="deltaPastDetailFlower" class="delta-past-flower" aria-hidden="true"></span></div>'+
         '<span class="delta-past-hero-index" id="deltaPastHeroIndex" aria-hidden="true">I</span>'+
       '</div>'+
       '<div class="delta-past-story-content">'+
         '<div class="delta-past-story-meta"><span>ARQUIVO DAS MEMÓRIAS</span><span id="deltaPastStoryIndex">REGISTRO I</span></div>'+
         '<span class="delta-past-story-ornament" aria-hidden="true">✧ ─ ✦ ─ ✧</span>'+
         '<h2 id="deltaPastDetailTitle"></h2>'+
         '<span class="delta-past-story-divider" aria-hidden="true"></span>'+
         '<p id="deltaPastDetailStory" class="delta-past-story-text" hidden></p>'+
         '<div class="delta-past-placeholder" aria-hidden="true"><i></i><i></i><i></i></div>'+
       '</div>'+
     '</div>'+
    '<form class="delta-past-squire-gate" hidden autocomplete="off" aria-label="Código secreto do Escudeiro">'+
      '<span class="delta-past-gate-mark" aria-hidden="true">✦</span>'+
      '<input class="delta-past-gate-input" type="password" name="cifra" spellcheck="false" autocapitalize="none" autocomplete="off" maxlength="40" placeholder="••••" aria-label="Digite a senha secreta">'+
      '<button type="submit" aria-label="Revelar o nome oculto">↵</button>'+
      '<span class="delta-past-gate-status" role="status" aria-live="polite"></span>'+
    '</form>'+
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
 const secretGate=dialog.querySelector('.delta-past-squire-gate');
 const secretInput=dialog.querySelector('.delta-past-gate-input');
 const secretStatus=dialog.querySelector('.delta-past-gate-status');
 const secretGlyphs='✦✧◇◆◈◉◌◍⟡⋄⌁╳';
 // O texto original traz apenas #####; sem um nome real fornecido, não inventamos a identidade.
 const secretSquireName='Forn';
 let cipherTimer=null,cipherSpan=null;
 function stopCipher(){
  if(cipherTimer!==null){clearInterval(cipherTimer);cipherTimer=null;}
 }
 function resetCipher(){
  stopCipher();cipherSpan=null;
  secretGate.hidden=true;secretInput.value='';
  secretStatus.textContent='';secretGate.classList.remove('delta-past-gate-error');
  detail.classList.remove('delta-past-secret-revealed');
 }
 function scrambleCipher(){
  if(!cipherSpan)return;
  cipherSpan.textContent=Array.from({length:8},()=>secretGlyphs[Math.floor(Math.random()*secretGlyphs.length)]).join('');
 }
 secretGate.addEventListener('submit',event=>{
  event.preventDefault();
  if(detail.dataset.person!=='squire'||!cipherSpan)return;
  if(secretInput.value.trim().toLocaleLowerCase('pt-BR')!=='eixo'){
   secretStatus.textContent='Código incorreto';
   secretGate.classList.remove('delta-past-gate-error');
   void secretGate.offsetWidth;
   secretGate.classList.add('delta-past-gate-error');
   secretInput.select();
   return;
  }
  stopCipher();
  cipherSpan.textContent=secretSquireName;
  cipherSpan.setAttribute('aria-label','Identidade decifrada: '+secretSquireName);
  cipherSpan.classList.add('delta-past-cipher-open');
  detail.classList.add('delta-past-secret-revealed');
  secretStatus.textContent='Registro decifrado';
  secretInput.value='';
  secretInput.disabled=true;
 });
 function showGallery(){
  resetCipher();
  secretInput.disabled=false;
  gallery.hidden=false;detail.hidden=true;
  detail.removeAttribute('data-portrait');
  detail.removeAttribute('data-person');
 }
 function showPerson(person,card){
  resetCipher();secretInput.disabled=false;
  returnCard=card||null;
  gallery.hidden=true;detail.hidden=false;
  detail.style.setProperty('--delta-past-accent',person.tone);
  detail.dataset.person=person.id;
  if(person.portrait)detail.dataset.portrait=person.portrait;
  else detail.removeAttribute('data-portrait');
  dialog.querySelector('#deltaPastStoryIndex').textContent='REGISTRO '+person.roman;
  dialog.querySelector('#deltaPastHeroIndex').textContent=person.roman;
  const visual=dialog.querySelector('#deltaPastDetailFlower');
  visual.className=person.id==='sorcerer'?'delta-past-crest-art':'delta-past-flower delta-past-'+person.id;
  visual.textContent=person.id==='sorcerer'?'✦':'';
  dialog.querySelector('#deltaPastDetailTitle').textContent=person.name;
  const text=dialog.querySelector('#deltaPastDetailStory');
  const placeholder=dialog.querySelector('.delta-past-detail .delta-past-placeholder');
  text.textContent=person.story||'';
  if(person.id==='squire' && person.story && person.story.includes('#####')){
   const parts=person.story.split('#####');
   cipherSpan=document.createElement('span');
   cipherSpan.className='delta-past-cipher';
   cipherSpan.setAttribute('aria-label','Identidade censurada');
   text.replaceChildren(document.createTextNode(parts[0]),cipherSpan,document.createTextNode(parts.slice(1).join('#####')));
   secretGate.hidden=false;
   scrambleCipher();
   if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    cipherTimer=setInterval(()=>{if(dialog.open&&!document.hidden)scrambleCipher();},145);
   }
  }
  text.hidden=!person.story;
  placeholder.hidden=Boolean(person.story);
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
  resetCipher();secretInput.disabled=false;
  dialog.classList.remove('delta-past-opening');
  heart.focus({preventScroll:true});
 });
})();