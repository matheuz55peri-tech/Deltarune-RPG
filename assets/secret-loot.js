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
  function chestSvg(c){
   const lid=c.type==='pyramid'
    ?'<path d="M22 64 L58 13 L102 13 L141 64 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="5"/><path d="M58 13 L81 64 L102 13" fill="none" stroke="'+c.edge+'" stroke-width="4"/>'
    :c.type==='arched'
    ?'<path d="M19 62 Q22 18 81 20 Q139 22 144 62 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="6"/>'
    :c.type==='waves'
    ?'<path d="M17 62 Q39 15 81 36 Q124 5 145 62 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="6"/>'
    :c.type==='flat'
    ?'<path d="M20 39 L132 39 L145 65 L13 65 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="5"/>'
    :'<path d="M20 47 L56 15 L78 35 L102 9 L142 49 L134 66 L18 66 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="5"/>';
   return '<svg viewBox="0 0 165 165" role="img" aria-label="Baú '+c.description+'"><g>'+
    '<path d="M24 61 L140 61 L132 136 L33 136 Z" fill="'+c.base+'" stroke="'+c.edge+'" stroke-width="6"/>'+
    '<path d="M31 78 L132 78 M37 119 L130 119" stroke="'+c.edge+'" stroke-width="3" opacity=".8"/>'+
    '<path d="M43 81 L43 129 M120 81 L120 129" stroke="'+c.color+'" stroke-width="5"/>'+
    '<path d="M67 78 L97 78 L92 120 L72 120 Z" fill="'+c.edge+'" opacity=".48"/>'+
    '<g class="chest-lid">'+lid+
    '<path d="M15 63 L148 63 L143 75 L20 75 Z" fill="'+c.edge+'" stroke="'+c.base+'" stroke-width="2"/>'+
    '</g><path d="M72 70 L92 70 L92 91 L72 91 Z" fill="'+c.edge+'" stroke="'+c.accent+'" stroke-width="2"/>'+
    '<circle cx="82" cy="80" r="5" fill="'+c.base+'" stroke="'+c.accent+'" stroke-width="2"/>'+
    (c.type==='waves'?'<path d="M48 96 Q65 82 82 96 T117 96" stroke="'+c.accent+'" stroke-width="3" fill="none"/>':'')+
    (c.type==='broken'?'<path d="M55 36 L68 54 L58 63" fill="none" stroke="'+c.accent+'" stroke-width="3"/>':'')+
    '</g></svg>';
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
    openButton.disabled=false;
    openButton.textContent='✦ ABRIR BAÚ';
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