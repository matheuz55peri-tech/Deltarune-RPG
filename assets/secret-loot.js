/* DELTA RPG — portal secreto, com os dois GIFs originais. */
(() => {
 'use strict';
 function init(){
  if(document.getElementById('deltaSecretEye'))return;
  const eye=document.createElement('button');
  eye.type='button';eye.id='deltaSecretEye';eye.title='';eye.setAttribute('aria-label','Sinal oculto');
  eye.innerHTML='<span aria-hidden="true">◉</span>';document.body.append(eye);
  const gate=document.createElement('dialog');gate.id='deltaSecretGate';
  gate.innerHTML='<form method="dialog" id="deltaSecretGateForm">'+
   '<div class="delta-secret-gate-heading">✧ OLHO VELADO</div>'+
   '<p>Uma palavra desperta aquilo que observa.</p>'+
   '<label for="deltaSecretPassword">SENHA</label>'+
   '<input id="deltaSecretPassword" type="password" autocomplete="off" required maxlength="60" spellcheck="false">'+
   '<span id="deltaSecretGateError" role="alert" aria-live="polite"></span>'+
   '<div class="delta-secret-gate-actions"><button type="button" id="deltaSecretGateCancel">VOLTAR</button>'+
   '<button type="submit">REVELAR</button></div></form>';
  document.body.append(gate);
  const scene=document.createElement('section');scene.id='deltaSecretScene';scene.hidden=true;
  scene.setAttribute('aria-label','Lugar secreto');
  scene.innerHTML=[
   '<button id="deltaSecretReturn" type="button" aria-label="Voltar ao normal">×</button>',
   '<div id="deltaSecretEyeStage" class="delta-secret-eye-stage">',
   '<button id="deltaSecretPupil" type="button" aria-label="Olhar através da pupila">',
   '<img id="deltaSecretEyeGif" src="./assets/secret/eye.gif" alt="Um olho animado observa você">',
   '</button><span class="delta-secret-eye-hint">O olho observa. Toque a pupila.</span></div>',
   '<div id="deltaSecretFlowers" class="delta-secret-flowers" aria-hidden="true">',
   '<img src="./assets/secret/08aa907e7871bf74f4585b3a76eb75d5.gif" alt="Livro animado aberto">',
   '<div class="delta-secret-flower-shade"></div>',
   '<div class="delta-secret-message" role="status">Este lugar foi feito para você</div></div>',
   '<div id="deltaSecretZoom" aria-hidden="true"></div>'
  ].join('');
  document.body.append(scene);
  const pass=gate.querySelector('#deltaSecretPassword'),error=gate.querySelector('#deltaSecretGateError');
  const pupil=scene.querySelector('#deltaSecretPupil');
  let savedOverflow='',transitioning=false;
  eye.addEventListener('click',()=>{pass.value='';error.textContent='';gate.showModal();pass.focus();});
  gate.querySelector('#deltaSecretGateCancel').addEventListener('click',()=>gate.close());
  gate.querySelector('form').addEventListener('submit',e=>{
   e.preventDefault();
   if(pass.value.trim()!=='Oculto'){
    error.textContent='A palavra não foi reconhecida.';pass.select();return;
   }
   gate.close();pass.value='';error.textContent='';
   savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
   scene.hidden=false;scene.classList.remove('delta-revealed','delta-zooming');
   transitioning=false;pupil.focus();
  });
  pupil.addEventListener('click',()=>{
   if(transitioning)return;transitioning=true;
   scene.classList.add('delta-zooming');
   const reveal=()=>{if(scene.hidden)return;scene.classList.add('delta-revealed');};
   if(matchMedia('(prefers-reduced-motion: reduce)').matches)reveal();
   else setTimeout(reveal,850);
  });
  function close(){
   scene.hidden=true;scene.classList.remove('delta-revealed','delta-zooming');
   document.body.style.overflow=savedOverflow;eye.focus();
  }
  scene.querySelector('#deltaSecretReturn').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!scene.hidden)close();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();