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
  function chestSvg(c){
   const line='#292523',light=c.accent,metal=c.edge,wood=c.base;
   const ink='stroke="'+line+'" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"';
   const strokes='<g fill="none" stroke="'+line+'" stroke-opacity=".42" stroke-width="1" stroke-linecap="round">'+
      '<path d="M36 113l12 3m4 2l9 2m47-5l9-3M49 131l10-2m54-28l5 4M35 94l6-2"/>'+
      '</g>';
   let body='',lid='',detail='';
   if(c.id==='tarare'){
     // Pirâmide escalonada do conceito original, não caixa retangular.
     body='<path d="M31 93l59 15 53-14-8 36-47 22-53-21z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M31 93l59 15-2 44-53-21z" fill="'+metal+'" fill-opacity=".56" '+ink+'/>'+
      '<path d="M90 108l53-14-8 36-47 22z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M23 129l64 18 56-19 8 12-65 20-69-22z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M30 135l56 16 55-19" fill="none" stroke="'+light+'" stroke-width="2"/>'+
      '<path d="M62 112l22 5m-16 5l12 3m23-8l17-6" fill="none" stroke="'+line+'" stroke-width="1.7"/>';
     lid='<path d="M21 90L88 16l60 74-59 26z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M88 16l1 100 59-26z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M21 90l68 26-1-100z" fill="'+light+'" fill-opacity=".40" '+ink+'/>'+
      '<path d="M51 84l37-45 37 49-37 17z" fill="none" stroke="'+line+'" stroke-width="2.1"/>'+
      '<path d="M64 81l24-29 24 30-24 13z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M88 39v14m-19 49l-14-8m62-8l10-3" fill="none" stroke="'+line+'" stroke-width="1.4"/>'+
      '<path d="M20 90l69 26 60-26-3 11-57 27-69-28z" fill="'+metal+'" '+ink+'/>';
     detail='<path d="M75 80q13-14 27 0-14 12-27 0Z" fill="'+light+'" '+ink+'/>'+
      '<circle cx="89" cy="80" r="5.3" fill="'+line+'"/>';
   }else if(c.id==='ruby'){
     body='<path d="M26 69l76 14 42-13-6 62-43 20-69-21z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M26 69l76 14-7 69-69-21z" fill="'+metal+'" fill-opacity=".7" '+ink+'/>'+
      '<path d="M102 83l42-13-6 62-43 20z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M38 91l48 10-2 31-45-11zM110 102l21-8-2 30-21 9z" fill="none" stroke="'+light+'" stroke-opacity=".55" stroke-width="2"/>'+
      '<path d="M24 129l15 7m88 0l12-7" stroke="'+line+'" stroke-width="4"/>';
     lid='<path d="M17 72Q26 20 77 23q43-7 66 45l-39 20-87-16z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M17 72q19-35 46-43m44 8q21 15 36 31" stroke="'+metal+'" stroke-width="7" fill="none"/>'+
      '<path d="M34 72q19-30 41-35q21-4 39 12" stroke="'+light+'" stroke-opacity=".6" stroke-width="1.5" fill="none"/>'+
      '<path d="M17 72l87 16 39-20v13l-39 20-87-17z" fill="'+metal+'" '+ink+'/>';
     detail='<path d="M60 77l17-4 10 16-14 10-13-13z" fill="'+light+'" '+ink+'/>'+
      '<path d="M71 83l9-2-5 9z" fill="'+wood+'" '+ink+'/>';
   }else if(c.id==='carps'){
     body='<path d="M23 73q48 16 105-6l16 52q-52 35-115 11z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M26 83q48 19 109-3M31 105q50 19 109-3M37 127q43 16 102-4" fill="none" stroke="'+metal+'" stroke-width="4"/>'+
      '<path d="M42 91q10 6 20 2t19 3t21-1t23-4M45 116q12 6 22 1t19 5t23-2" fill="none" stroke="'+light+'" stroke-width="1.8"/>'+
      '<path d="M32 132l7 11 13-4m68-7l8 9 11-12" fill="'+metal+'" '+ink+'/>';
     lid='<path d="M12 75q16-32 48-33q36-25 74 8l12 23q-64 33-134 2z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M12 75q35 18 74 13q36-2 60-15l2 13q-63 32-137 2z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M26 66q42 17 94-7M44 50q41 20 76 2" fill="none" stroke="'+light+'" stroke-width="3"/>'+
      '<path d="M38 51q4-19 16-18q10 4 4 18M109 47q3-18 15-19q11 3 5 23" fill="none" stroke="'+line+'" stroke-width="2"/>';
     detail='<path d="M72 78q11-12 21 0q-11 9-21 0z" fill="'+light+'" '+ink+'/>'+
      '<circle cx="81" cy="78" r="3" fill="'+line+'"/>';
   }else if(c.id==='desert'){
     body='<path d="M26 73l75 11 41-14-7 61-44 20-65-20z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M26 73l75 11-10 67-65-20z" fill="'+metal+'" fill-opacity=".65" '+ink+'/>'+
      '<path d="M26 113l64 21 48-21" stroke="'+line+'" fill="none" stroke-width="1.5"/>'+
      '<path d="M31 130l5 13 9 2m82-11l4 8 8-7" fill="'+wood+'" '+ink+'/>';
     lid='<path d="M26 52l69-20 41 23 9 19-44 20-82-18z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M26 52l69-20 41 23-46 17z" fill="'+light+'" fill-opacity=".3" '+ink+'/>'+
      '<path d="M19 76l82 18 44-20-3 13-43 19-83-18z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M36 58l62-16M40 68l58-16m-10-11l9 6" fill="none" stroke="'+line+'" stroke-width="1.3"/>';
     detail='<path d="M76 87l23 6-2 24-22-7z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M84 99l7 2" stroke="'+line+'" stroke-width="2"/>';
   }else{
     body='<path d="M20 73l78 12 43-23 5 64-54 25-65-23z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M20 73l78 12-6 66-65-23z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M98 85l43-23 5 64-54 25z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M38 97l50 16M38 115l49 14m19-33l22-11m-24 30l24-13" fill="none" stroke="'+light+'" stroke-width="2"/>'+
      '<path d="M29 124l-9 24 20-13m85 0l26 8-8-21" fill="'+metal+'" '+ink+'/>';
     lid='<path d="M9 70l17-37 22 14 28-33 26 24 22-24 31 44-14 18-49 26z" fill="'+wood+'" '+ink+'/>'+
      '<path d="M9 70l83 32 49-26 14-18-54-19-27-25" fill="'+metal+'" fill-opacity=".35" '+ink+'/>'+
      '<path d="M9 70l83 32 49-26 1 13-50 28L6 85z" fill="'+metal+'" '+ink+'/>'+
      '<path d="M27 42l24 17 23-45 27 24 23-24" stroke="'+light+'" stroke-width="2" fill="none"/>';
     detail='<path d="M72 95l23 6-4 22-22-9z" fill="'+light+'" '+ink+'/>'+
      '<path d="M81 104l6 3-6 6z" fill="'+line+'"/>';
   }
   return '<svg viewBox="0 0 165 165" role="img" aria-label="'+c.name+'"><g>'+
    body+'<g class="chest-lid">'+lid+'</g>'+detail+strokes+'</g></svg>';
  }
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
   art.innerHTML=chestSvg(c);
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
   warp.classList.remove('active');void warp.offsetWidth;warp.classList.add('active');
   setTimeout(()=>{
    realm.hidden=false;document.body.style.overflow='hidden';
    const video=realm.querySelector('video');
    video.play().catch(()=>{});
   },610);
   setTimeout(()=>warp.classList.remove('active'),900);
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