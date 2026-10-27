/* DELTA RPG — portal secreto com assets originais do usuário */
(() => {
 'use strict';
 function init(){
  if(document.getElementById('deltaSecretEye'))return;
  const eye=document.createElement('button');
  eye.id='deltaSecretEye';eye.type='button';eye.title='';eye.setAttribute('aria-label','Segredo');
  eye.innerHTML='<span aria-hidden="true">◉</span>';document.body.append(eye);
  const gate=document.createElement('dialog');gate.id='deltaSecretGate';
  gate.innerHTML='<form method="dialog" id="deltaSecretGateForm"><div class="delta-secret-gate-heading">✧ OLHO VELADO</div><p>Uma palavra desperta aquilo que observa.</p><label for="deltaSecretPassword">SENHA</label><input id="deltaSecretPassword" type="password" autocomplete="off" required maxlength="60"><span id="deltaSecretGateError" role="alert" aria-live="polite"></span><div class="delta-secret-gate-actions"><button type="button" id="deltaSecretGateCancel">VOLTAR</button><button type="submit">REVELAR</button></div></form>';
  document.body.append(gate);
  const realm=document.createElement('section');realm.id='deltaLootRealm';realm.hidden=true;
  realm.setAttribute('aria-label','O outro lado');
  realm.innerHTML='<div class="secret-flower-bg" aria-hidden="true"></div><div class="secret-eye-stage"><button id="secretPupil" type="button" aria-label="Olhar através da pupila"><img src="./assets/secret/eye-original.gif" alt="Olho misterioso animado"></button><p class="secret-eye-hint">O olho espera.</p></div><div class="secret-flower-message" aria-live="polite"><p>Este lugar foi feito para você</p></div><button type="button" id="deltaBackToNormal">VOLTAR AO NORMAL</button>';
  document.body.append(realm);
  const password=gate.querySelector('#deltaSecretPassword'),error=gate.querySelector('#deltaSecretGateError');
  gate.querySelector('#deltaSecretGateCancel').addEventListener('click',()=>gate.close());
  eye.addEventListener('click',()=>{password.value='';error.textContent='';gate.showModal();password.focus();});
  function showRealm(){realm.hidden=false;realm.classList.remove('secret-revealed');document.body.style.overflow='hidden';}
  gate.querySelector('form').addEventListener('submit',e=>{e.preventDefault();if(password.value.trim()==='Oculto'){gate.close();showRealm();}else{error.textContent='A palavra não foi reconhecida.';password.select();}});
  realm.querySelector('#secretPupil').addEventListener('click',()=>{realm.classList.add('secret-revealed');});
  function goBack(){realm.hidden=true;realm.classList.remove('secret-revealed');document.body.style.overflow='';eye.focus();}
  realm.querySelector('#deltaBackToNormal').addEventListener('click',goBack);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!realm.hidden)goBack();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();