/* DELTA RPG v9 — novos mundos, subtemas e vozes de interface do áudio fornecido. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const themePanel=$('themePopover'),themeOptions=themePanel?.querySelector('.theme-options');
  const themeControl=$('themeControl');
  if(!themePanel || !themeOptions || !themeControl)return;
  const prefKey='delta-rpg-worlds-v9';
  const soundKey='delta-rpg-sounds-v9';
  const names={classic:'ORIGINAL',snow:'NEVE',forest:'FLORESTA',cosmos:'COSMOS',city:'CIDADE',garden:'JARDIM AZUL',nightfall:'PLAYGROUND'};
  const fallback=(()=>{try{
    const legacy=JSON.parse(localStorage.getItem('delta-rpg-appearance-v1')||'null');
    return ['classic','snow','forest'].includes(legacy?.theme)?legacy.theme:'classic'
  }catch(_){return 'classic'}})();
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(prefKey)||'null')||{}}catch(_){}
  const legacyKey='delta-rpg-appearance-v1';
  let legacy={};
  try{legacy=JSON.parse(localStorage.getItem(legacyKey)||'null')||{}}catch(_){}
  // O tema antigo "playground" é integrado ao tema NOITE DOURADA, que já
  // possuía os cenários Parque e Lampião. Nenhum cenário é excluído.
  const storedTheme=saved.theme==='playground'?'nightfall':saved.theme;
  const world={
    theme:names[storedTheme]?storedTheme:fallback,
    forestScene:['night','waterfall'].includes(saved.forestScene)?saved.forestScene:'night',
    cityScene:['balcony','subway','room','street'].includes(saved.cityScene)?saved.cityScene:'balcony',
    gardenScene:['blue','hydrangea'].includes(saved.gardenScene)?saved.gardenScene:'blue',
    nightScene:['playground','lamplight'].includes(saved.nightScene)?saved.nightScene:
      (['playground','lamplight'].includes(legacy.nightScene)?legacy.nightScene:'playground')
  };
  // O HTML já contém Cosmos, Cidade e Jardim: reutilizar os botões,
  // em vez de acrescentar uma segunda cópia de cada tema.
  const newThemes=[
    {key:'cosmos',title:'COSMOS',subtitle:'Além das estrelas'},
    {key:'city',title:'CIDADE',subtitle:'Varanda, metrô, quarto e rua'},
    {key:'garden',title:'JARDIM AZUL',subtitle:'Jardim chuvoso e hortênsias'},
    {key:'nightfall',title:'PLAYGROUND',subtitle:'Parque e lampião'}
  ];
  function buildThemeOption(item){
    const button=document.createElement('button');
    button.type='button';button.className='theme-option';button.dataset.themeChoice=item.key;
    button.setAttribute('aria-pressed','false');
    const image=document.createElement('span');image.className='theme-thumb';
    const wrap=document.createElement('span');wrap.className='theme-info';
    const content=document.createElement('span');
    const heading=document.createElement('strong');heading.textContent=item.title;
    const subtitle=document.createElement('small');subtitle.style.display='block';subtitle.textContent=item.subtitle;
    content.append(heading,subtitle);wrap.append(content);
    button.append(image,wrap);themeOptions.append(button);
    return button;
  }
  newThemes.forEach(item=>{
    const existing=themeOptions.querySelector('[data-theme-choice="'+item.key+'"]');
    if(!existing){buildThemeOption(item);return;}
    const title=existing.querySelector('.theme-info strong');
    const subtitle=existing.querySelector('.theme-info small');
    if(title)title.textContent=item.title;
    if(subtitle)subtitle.textContent=item.subtitle;
  });
  function buildScenes(title,group,scenes){
    const section=document.createElement('section');
    section.className='theme-panel-divider';
    section.id=group+'SceneChoices';
    section.hidden=true;
    const heading=document.createElement('strong');heading.textContent='✧ '+title;
    const paragraph=document.createElement('p');
    paragraph.textContent='Escolha o cenário do tema. Suas fichas não serão modificadas.';
    const choices=document.createElement('div');choices.className='theme-sub-scenes';
    for(const item of scenes){
      const b=document.createElement('button');b.type='button';b.className='theme-scene-button';
      b.dataset.sceneGroup=group;b.dataset.sceneId=item.key;b.setAttribute('aria-pressed','false');
      const img=document.createElement('span');img.className='scene-thumb';
      const label=document.createElement('span');
      const name=document.createElement('strong');name.textContent=item.name;
      const detail=document.createElement('small');detail.textContent=item.description;
      label.append(name,detail);b.append(img,label);choices.append(b);
    }
    section.append(heading,paragraph,choices);
    const footer=themePanel.querySelector('.theme-tip');
    if(footer)footer.before(section);else themePanel.append(section);
    return section;
  }
  const forestChoices=buildScenes('CENÁRIOS DA FLORESTA','forest',[
    {key:'night',name:'Floresta Noturna',description:'Lago e vaga-lumes'},
    {key:'waterfall',name:'Cachoeira',description:'Águas e vegetação'}
  ]);
  const cityChoices=buildScenes('CENÁRIOS DA CIDADE','city',[
    {key:'balcony',name:'Varanda',description:'Vista azul e violeta'},
    {key:'subway',name:'Metrô',description:'Viagem ao pôr do sol'},
    {key:'room',name:'Quarto',description:'Noite aconchegante'},
    {key:'street',name:'Rua Noturna',description:'Luzes e silêncio'}
  ]);
  const gardenChoices=buildScenes('CENÁRIOS DO JARDIM','garden',[
    {key:'blue',name:'Jardim Azul',description:'Gotas pixeladas sobre as flores'},
    {key:'hydrangea',name:'Hortênsias',description:'Flores azuis em pixelart'}
  ]);
  // As versões antigas destes seletores continuam no HTML para segurança,
  // mas são escondidas somente após o novo painel estar pronto.
  document.documentElement.classList.add('delta-worlds-deduplicated');
  function closePopover(){
    themePanel.hidden=true;
    $('themeToggle')?.setAttribute('aria-expanded','false');
  }
  function showPopover(){
    themePanel.hidden=false;
    $('themeToggle')?.setAttribute('aria-expanded','true');
  }
  function applyWorld(){
    const html=document.documentElement;
    html.dataset.theme=world.theme;
    html.dataset.forestScene=world.forestScene;
    html.dataset.cityScene=world.cityScene;
    html.dataset.gardenScene=world.gardenScene;

    // O site antigo usa data-theme-scene; manter essa camada sincronizada.
    const scene=world.theme==='forest'?
      (world.forestScene==='waterfall'?'waterfall':''):
      world.theme==='city'?
        ({balcony:'balcony',subway:'metro',room:'bedroom',street:'street'}[world.cityScene]||''):
      world.theme==='garden'?(world.gardenScene==='hydrangea'?'hydrangea':''):
      world.theme==='nightfall'?world.nightScene:
      world.theme==='cosmos'?'cosmos':'';
    if(scene)html.dataset.themeScene=scene;
    else delete html.dataset.themeScene;

    const title=$('themeNow');if(title)title.textContent=names[world.theme]||'ORIGINAL';
    themeOptions.querySelectorAll('[data-theme-choice]').forEach(b=>{
      b.setAttribute('aria-pressed',String(b.dataset.themeChoice===world.theme));
    });
    forestChoices.hidden=world.theme!=='forest';
    cityChoices.hidden=world.theme!=='city';
    gardenChoices.hidden=world.theme!=='garden';
    const winter=$('winterOptions');if(winter)winter.hidden=world.theme!=='snow';
    const night=$('nightOptions');if(night)night.hidden=world.theme!=='nightfall';
    themePanel.querySelectorAll('[data-scene-group]').forEach(b=>{
      const group=b.dataset.sceneGroup;
      const selected=group==='forest'?world.forestScene:group==='city'?world.cityScene:world.gardenScene;
      b.setAttribute('aria-pressed',String(b.dataset.sceneId===selected));
    });
    themePanel.querySelectorAll('#nightOptions [data-scene]').forEach(b=>{
      b.setAttribute('aria-pressed',String(b.dataset.scene===world.nightScene));
    });
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content={
      classic:'#080713',snow:'#0d2941',forest:'#051d25',
      cosmos:'#07051b',city:'#150f2e',garden:'#042935',nightfall:'#261a10'
    }[world.theme]||'#080713';
    try{
      localStorage.setItem(prefKey,JSON.stringify(world));
      const old=JSON.parse(localStorage.getItem(legacyKey)||'null')||{};
      old.theme=world.theme;
      old.forestScene=world.forestScene==='waterfall'?'waterfall':'fireflies';
      // O motor antigo reconhece só 3 cenas de cidade; a Rua é guardada no v9.
      old.cityScene={balcony:'balcony',subway:'metro',room:'bedroom',street:'balcony'}[world.cityScene];
      old.gardenScene='hydrangea';
      old.nightScene=world.nightScene;
      localStorage.setItem(legacyKey,JSON.stringify(old));
    }catch(_){}
  }
  themeOptions.querySelectorAll('[data-theme-choice]').forEach(button=>{
    button.addEventListener('click',()=>{
      const key=button.dataset.themeChoice;
      if(!names[key])return;
      world.theme=key;
      applyWorld();
      if(['snow','forest','city','nightfall'].includes(key)){
        // Os controles antigos podem fechar o menu; mantenha aberto para escolher o subtema.
        setTimeout(showPopover,0);
      }else closePopover();
    });
  });
  themePanel.querySelectorAll('[data-scene-group]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(button.dataset.sceneGroup==='forest')world.forestScene=button.dataset.sceneId;
      else if(button.dataset.sceneGroup==='city')world.cityScene=button.dataset.sceneId;
      else if(button.dataset.sceneGroup==='garden')world.gardenScene=button.dataset.sceneId;
      world.theme=button.dataset.sceneGroup;
      applyWorld();
      closePopover();
    });
  });
  // O Playground mantém os dois cenários que existiam em NOITE DOURADA.
  themePanel.querySelectorAll('#nightOptions [data-scene]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(!['playground','lamplight'].includes(button.dataset.scene))return;
      world.theme='nightfall';
      world.nightScene=button.dataset.scene;
      applyWorld();
      closePopover();
    });
  });
  applyWorld();

  /* Sons: cada toque usa um recorte curto do arquivo de voz fornecido pelo usuário. */
  let soundPrefs={enabled:true,volume:0.24};
  try{
    const savedAudio=JSON.parse(localStorage.getItem(soundKey)||'null');
    if(savedAudio&&typeof savedAudio==='object'){
      soundPrefs.enabled=savedAudio.enabled!==false;
      soundPrefs.volume=Number.isFinite(+savedAudio.volume)?Math.max(0,Math.min(.7,+savedAudio.volume)):.24;
    }
  }catch(_){}
  const clips=Array.from({length:10},(_,i)=>{
    const audio=new Audio('./assets/sfx/kawkaw-'+String(i+1).padStart(2,'0')+'.mp3');
    audio.preload='none';
    return audio;
  });
  const hoverIndices=[0,2,4,5,8],selectIndices=[1,3,6,7,9];
  let hoverIndex=0,selectIndex=0,lastHover=0,lastClick=0,lastHoverElement=null;
  function saveSounds(){try{localStorage.setItem(soundKey,JSON.stringify(soundPrefs))}catch(_){}}
  function playFX(type){
    if(!soundPrefs.enabled || soundPrefs.volume<=0)return;
    const now=performance.now();
    if(type==='hover' && now-lastHover<180)return;
    if(type==='select' && now-lastClick<90)return;
    if(type==='hover')lastHover=now;else lastClick=now;
    const soundIndex=type==='hover'
      ?hoverIndices[(hoverIndex++)%hoverIndices.length]
      :selectIndices[(selectIndex++)%selectIndices.length];
    const audio=clips[soundIndex];
    try{
      audio.pause();
      audio.currentTime=0;
      audio.volume=type==='hover'?soundPrefs.volume*.55:soundPrefs.volume;
      const promise=audio.play();
      if(promise?.catch)promise.catch(()=>{/* Som requer primeira interação do navegador. */});
    }catch(_){}
  }
  const toggle=document.createElement('button');
  toggle.type='button';toggle.id='soundToggle';toggle.className='reset-top sound-toggle';
  toggle.title='Ativar ou desativar os efeitos sonoros do menu';
  themeControl.insertAdjacentElement('afterend',toggle);
  function updateToggle(){
    toggle.setAttribute('aria-pressed',String(soundPrefs.enabled));
    toggle.innerHTML='<span class="sound-note" aria-hidden="true">'+(soundPrefs.enabled?'♫':'♪')+'</span> '+(soundPrefs.enabled?'SOM ON':'SOM OFF');
    toggle.setAttribute('aria-label',soundPrefs.enabled?'Desativar sons de interface':'Ativar sons de interface');
  }
  updateToggle();
  toggle.addEventListener('click',()=>{
    soundPrefs.enabled=!soundPrefs.enabled;
    saveSounds();updateToggle();
    if(soundPrefs.enabled)playFX('select');
  });
  const audioSettings=document.createElement('div');audioSettings.className='audio-settings';
  const volumeLabel=document.createElement('label');volumeLabel.htmlFor='deltaSoundVolume';volumeLabel.textContent='♫ VOLUME DOS SONS';
  const range=document.createElement('input');range.type='range';range.min='0';range.max='70';range.step='1';
  range.value=String(Math.round(soundPrefs.volume*100));range.id='deltaSoundVolume';
  range.setAttribute('aria-label','Volume dos efeitos sonoros');
  const value=document.createElement('span');value.className='audio-caption';value.textContent=range.value+'%';
  range.addEventListener('input',()=>{
    soundPrefs.volume=Number(range.value)/100;
    value.textContent=range.value+'%';
    saveSounds();
  });
  range.addEventListener('change',()=>playFX('select'));
  audioSettings.append(volumeLabel,range,value);themePanel.append(audioSettings);
  document.addEventListener('pointerover',e=>{
    const el=e.target?.closest?.('button,a,[role="tab"],.file-card');
    if(!el||el===lastHoverElement || el===toggle || audioSettings.contains(el))return;
    lastHoverElement=el;
    // A maioria dos navegadores só permite áudio após um primeiro clique.
    if(navigator.userActivation?.hasBeenActive===false)return;
    playFX('hover');
  },{passive:true});
  document.addEventListener('pointerout',e=>{
    const el=e.target?.closest?.('button,a,[role="tab"],.file-card');
    if(el===lastHoverElement && !el.contains(e.relatedTarget))lastHoverElement=null;
  },{passive:true});
  document.addEventListener('click',e=>{
    const target=e.target?.closest?.('button,a,[role="tab"]');
    if(!target||target===toggle)return;
    playFX('select');
  },true);
})();


/* Camada de chuva pixelart exclusiva do tema Jardim Azul. */
(() => {
  if (document.getElementById('deltaGardenRainScript')) return;
  const script = document.createElement('script');
  script.id = 'deltaGardenRainScript';
  script.src = './assets/themes/garden-rain.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
})();
