/* DELTA RPG - mundo secreto dos baús; recompensas serão configuradas depois. */
(() => {
 'use strict';
 function init(){
  if(document.getElementById('deltaSecretEye'))return;
  const eye=document.createElement('button');
  eye.id='deltaSecretEye';eye.type='button';eye.title='O olho observa...';
  eye.setAttribute('aria-label','Revelar o reino oculto');
  const gif=document.createElement('img');gif.src='./assets/secret/eye.gif';
  gif.alt='';gif.onerror=()=>{gif.hidden=true;};
  const fallback=document.createElement('span');fallback.className='delta-eye-fallback';
  fallback.innerHTML='<img alt="" src="./assets/secret/eye.svg">';eye.append(gif,fallback);
  document.body.append(eye);
  const warp=document.createElement('div');
  warp.id='deltaPortalTransition';warp.setAttribute('aria-hidden','true');
  warp.innerHTML='<span class="eye">◉</span>';document.body.append(warp);
  const realm=document.createElement('section');
  realm.id='deltaLootRealm';realm.hidden=true;
  realm.setAttribute('aria-label','Mundo oculto dos baús');
  realm.innerHTML=[
   '<video class="loot-video" autoplay muted loop playsinline preload="metadata">',
   '<source src="./assets/secret/realm.mp4" type="video/mp4"></video>',
   '<main class="loot-realm-inner"><header class="loot-realm-header">',
   '<h1>✧ O OUTRO LADO</h1><button id="deltaBackToNormal" type="button">',
   '↩ VOLTAR AO NORMAL</button></header>',
   '<p class="loot-description">Cinco baús. Cinco mundos. Escolha um para revelar seu selo.</p>',
   '<p class="loot-description" style="margin-top:-18px;font-size:10px">Desenhos originais: ',
   '<a href="https://laurabevon.com/chest-designs/" target="_blank" rel="noopener noreferrer" style="color:#e0cfa7">Laura Bevon — Chest Designs</a></p>',
   '<div id="deltaLootGrid" class="loot-grid"></div>',
   '<div id="deltaLootSelected" class="loot-selected" hidden>',
   '<h2 id="deltaLootName"></h2><p id="deltaLootText"></p>',
   '<button type="button" id="deltaLootOpen" class="loot-open-button">✦ ABRIR BAÚ</button>',
   '<p id="deltaLootResult" aria-live="polite"></p></div></main>'
  ].join('');
  document.body.append(realm);
  const entries=[
   {id:'tarare',name:'BAÚ DE TARÀRÊ',description:'Cidade do ouro',color:'#f8ce6a',base:'#a87723',edge:'#e8bd4f',accent:'#fff3ac',type:'pyramid'},
   {id:'ruby',name:'BAÚ DE RUBI',description:'Floresta avermelhada',color:'#ee5a65',base:'#772532',edge:'#ce4b57',accent:'#ffb0a8',type:'arched'},
   {id:'carps',name:'BAÚ DAS CARPAS',description:'Floresta das escamóides',color:'#73d8ce',base:'#215c64',edge:'#64c6a9',accent:'#b0f5e2',type:'waves'},
   {id:'desert',name:'BAÚ DESÉRTICO',description:'Terras áridas',color:'#e7b86c',base:'#796047',edge:'#dcb67b',accent:'#ffe5a5',type:'flat'},
   {id:'displaced',name:'BAÚ DESLOCADO',description:'Todos os mundos sombrios',color:'#bb97ed',base:'#262039',edge:'#756a94',accent:'#eacbff',type:'broken'}
  ];
  // Cinco silhuetas desenhadas de acordo com o estudo original de baús
  // de Laura Bevon. Linhas finas de concept art, sem formas genéricas.
  // Taràrê: pirâmide (imagem original, fileira inferior central);
  // Rubi: caixa ornamentada de tampa arqueada;
  // Carpas: caixa aquática trançada e curva;
  // Desértico: cofre simples e gasto de topo baixo;
  // Deslocado: baú com abas e pontas assimétricas.
  // Os desenhos são recortados da prancha original fornecida pela pessoa.
  // Nenhuma geração ou redesenho geométrico é usada nos cards.
  const grid=document.getElementById('deltaLootGrid');
  const panel=document.getElementById('deltaLootSelected');
  const name=document.getElementById('deltaLootName');
  const detail=document.getElementById('deltaLootText');
  const result=document.getElementById('deltaLootResult');
  const openButton=document.getElementById('deltaLootOpen');
  let chosen=null,playing=false;
  for(const c of entries){
   const button=document.createElement('button');button.type='button';
   button.className='loot-chest';button.dataset.chest=c.id;
   button.style.setProperty('--chest-glow',c.color);
   button.setAttribute('aria-pressed','false');
   const art=document.createElement('span');art.className='loot-chest-art';
   // Recortes dos desenhos ORIGINAIS enviados: Laura Bevon, Chest Designs.
   // A imagem fica no site da artista; preservamos a assinatura/crédito.
   const originalPositions={
     tarare:[1,2],ruby:[3,3],carps:[4,1],desert:[3,0],displaced:[4,3]
   };
   const position=originalPositions[c.id];
   art.classList.add('loot-chest-original');
   art.style.setProperty('--sheet-x',(-position[0]*185)+'px');
   art.style.setProperty('--sheet-y',([0,-158,-417,-583,-754][position[1]])+'px');
   art.innerHTML='<span class="loot-original-paint" aria-hidden="true"></span>';
   const title=document.createElement('strong');title.textContent=c.name;
   const subtitle=document.createElement('small');subtitle.textContent=c.description;
   button.append(art,title,subtitle);
   button.addEventListener('click',()=>{
    if(playing)return;
    chosen=c;panel.hidden=false;result.textContent='';
    document.querySelectorAll('.loot-chest').forEach(el=>{
     el.setAttribute('aria-pressed',String(el===button));el.classList.remove('open');
    });
    name.textContent=c.name;detail.textContent=c.description+' · Recompensas ainda não cadastradas.';
    openButton.disabled=c.id!=='tarare';
    openButton.textContent=c.id==='tarare'?'✦ ABRIR BAÚ':'✧ ABERTURA EM PREPARAÇÃO';
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});
   });
   grid.append(button);
  }
  openButton.addEventListener('click',()=>{
   if(!chosen||playing)return;
   const card=grid.querySelector('[data-chest="'+chosen.id+'"]');
   playing=true;openButton.disabled=true;
   card.classList.remove('open');void card.offsetWidth;card.classList.add('open');
   openButton.textContent='✦ REVELANDO...';
   result.textContent='O selo se rompe...';
   setTimeout(()=>{
    result.textContent='✦ Este baú ainda não possui uma tabela de loot. Nenhum item foi adicionado.';
    playing=false;openButton.disabled=false;openButton.textContent='↻ ABRIR NOVAMENTE';
   },1350);
  });
  let priorOverflow='';
  function showRealm(){
   if(!realm.hidden)return;
   priorOverflow=document.body.style.overflow;
   const reveal=()=>{
    realm.hidden=false;
    document.body.style.overflow='hidden';
    const video=realm.querySelector('video');
    video.play().catch(()=>{});
   };
   if(window.DeltaEyeCrack?.play)window.DeltaEyeCrack.play(reveal);
   else reveal();
  }
  function goBack(){
   realm.hidden=true;document.body.style.overflow=priorOverflow;
   realm.querySelector('video').pause();
   warp.classList.remove('active');
   eye.focus();
  }
  eye.addEventListener('click',showRealm);
  document.getElementById('deltaBackToNormal').addEventListener('click',goBack);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!realm.hidden)goBack()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();