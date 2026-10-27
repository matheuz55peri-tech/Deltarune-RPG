/* DELTA RPG · Caixa postal persistente das fichas (Firebase Realtime Database)
   Authentication is always anonymous Firebase Auth; access controlled by DB rules. */
(()=>{'use strict';
const CONFIG_KEY='delta-rpg-master-connect-v1';
const TOKEN_KEY='delta-rpg-firebase-identity-v1';
const BIND_KEY='delta-rpg-shared-files-v1';
const CACHE_KEY='delta-rpg-master-cache-v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn('Falha ao salvar:',e)}};
const cleanUrl=x=>String(x||'').trim().replace(/\/+$/,'');
const randomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join('');
const normalize=x=>String(x||'FILE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_').slice(0,50)||'file';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let config=get(CONFIG_KEY,null),bindings=get(BIND_KEY,{}),token=get(TOKEN_KEY,null),loading=null;
let records={},working=false,poll=null,pushTimer=null,pushFileId=null,requestSerial=0;
function errorText(e){return String(e?.message||e||'Falha de conexão').replace(/^Firebase: /,'').slice(0,250);}
function init(){
 const bridge=window.DeltaRpgLiveBridge;
 if(!bridge)return;
 const filesTab=$('#tab-files')||document.body;
 const area=document.createElement('div');area.id='delta-owner-zone';
 area.innerHTML='<div class="owner-tools"><button id="deltaShareActive" type="button">✦ COMPARTILHAR FILE ATIVO</button><button id="deltaOpenOwner" type="button">▣ ARQUIVO DONO</button><span id="deltaOwnerBadge" role="status"></span></div>';
 filesTab.prepend(area);
 const dialog=document.createElement('dialog');dialog.id='deltaOwnerDialog';
 dialog.innerHTML='<div class="owner-dialog"><div class="owner-dialog-head"><h2>▣ ARQUIVO DONO</h2><button id="ownerClose" type="button" aria-label="Fechar">×</button></div>'+
 '<p class="owner-intro">Uma caixa postal para fichas de RPG. Cada jogador ocupa sempre o mesmo espaço ao compartilhar o mesmo FILE.</p>'+
 '<div class="owner-setup"><label>Modo <select id="ownerMode"><option value="player">JOGADOR · ENVIAR</option><option value="owner">MESTRE · RECEBER (DONO)</option></select></label>'+
 '<label>URL DO FIREBASE REALTIME DATABASE<input id="ownerDatabase" type="url" placeholder="https://seu-projeto-default-rtdb.firebaseio.com" autocomplete="off"></label>'+
 '<label>WEB API KEY DO FIREBASE<input id="ownerApiKey" type="text" autocomplete="off" placeholder="API Key pública do projeto"></label>'+
 '<label>CÓDIGO DO GRUPO<input id="ownerRoom" maxlength="64" placeholder="GERAR NO MODO MESTRE" autocomplete="off" spellcheck="false"></label>'+
 '<label id="ownerNameLabel">NOME DO JOGADOR<input id="ownerPlayer" maxlength="48" placeholder="Seu nome de jogador"></label>'+
 '<div class="owner-setup-actions"><button id="ownerGenerate" type="button">✧ GERAR CÓDIGO</button><button id="ownerConnect" type="button">CONECTAR / SALVAR</button><button id="ownerInvite" type="button">COPIAR CONVITE</button></div>'+
 '<div id="ownerStatus" role="status" aria-live="polite"></div></div>'+
 '<div id="ownerListWrap" hidden><div class="owner-list-bar"><strong>FICHAS RECEBIDAS</strong><button type="button" id="ownerRefresh">↻ ATUALIZAR</button></div><div id="ownerReceivedList"></div></div>'+
 '<p class="owner-disclaimer">Requer um projeto Firebase configurado com autenticação anônima e regras específicas. O site não ativa um banco de dados sozinho. Não envie dados pessoais nas fichas.</p></div>';
 document.body.append(dialog);
 const q=id=>document.getElementById(id),status=q('ownerStatus'),badge=q('deltaOwnerBadge');
 q('ownerClose').addEventListener('click',()=>dialog.close());
 const mode=q('ownerMode'),db=q('ownerDatabase'),key=q('ownerApiKey'),room=q('ownerRoom'),name=q('ownerPlayer');
 const params=new URLSearchParams(location.search);
 // URL-convenience only; never embed a secret admin token in invite links.
 if(params.get('deltaDb')&&params.get('deltaKey')&&params.get('deltaRoom')&&!config){
  config={mode:'player',databaseURL:params.get('deltaDb'),apiKey:params.get('deltaKey'),room:params.get('deltaRoom'),playerName:''};
 }
 function fill(){mode.value=config?.mode||'player';db.value=config?.databaseURL||'';key.value=config?.apiKey||'';room.value=config?.room||'';name.value=config?.playerName||'';modeChange();}
 function modeChange(){const isOwner=mode.value==='owner';q('ownerNameLabel').hidden=isOwner;q('ownerGenerate').hidden=!isOwner;q('ownerListWrap').hidden=!isOwner;}
 mode.addEventListener('change',modeChange);
 function report(s,bad=false){status.textContent=s;status.dataset.error=String(bad);}
 function valid(c){if(!c||!/^https:\/\/[\w.-]+\.(?:firebaseio\.com|firebasedatabase\.app)$/.test(c.databaseURL))throw Error('Use uma URL https://...firebaseio.com ou ...firebasedatabase.app');if(!c.apiKey||c.apiKey.length<15)throw Error('Informe a Web API Key do Firebase.');if(!/^[a-zA-Z0-9_-]{12,64}$/.test(c.room))throw Error('O código do grupo deve conter 12 a 64 letras, números ou _.');}
 function collect(){const c={mode:mode.value,databaseURL:cleanUrl(db.value),apiKey:key.value.trim(),room:room.value.trim(),playerName:name.value.trim().slice(0,48)};valid(c);return c;}
 function authKey(c){return c.databaseURL+'|'+c.apiKey;}
 async function auth(c){
  if(token?.project!==authKey(c))token=null;
  if(token?.expires>Date.now()+60000)return token;
  if(loading)return loading;
  loading=(async()=>{
   const saved=get(TOKEN_KEY,null);
   if(!token&&saved?.project===authKey(c))token=saved;
   let body;
   if(token?.refreshToken){
    const url='https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(c.apiKey);
    const resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refreshToken})});
    if(resp.ok){const data=await resp.json();body={idToken:data.id_token,refreshToken:data.refresh_token,uid:data.user_id,expires:Number(data.expires_in)};}
   }
   if(!body){
    const resp=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+encodeURIComponent(c.apiKey),
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});
    const data=await resp.json();if(!resp.ok)throw Error('Firebase Auth: '+(data.error?.message||resp.status)+' · ative autenticação Anônima');
    body={idToken:data.idToken,refreshToken:data.refreshToken,uid:data.localId,expires:Number(data.expiresIn)};
   }
   token={...body,project:authKey(c),expires:Date.now()+body.expires*1000-90000};
   save(TOKEN_KEY,token);return token;
  })();
  try{return await loading}finally{loading=null}
 }
 async function query(c,path,method='GET',data){
  valid(c);
  let authData=await auth(c);
  const call=()=>fetch(c.databaseURL+'/deltaRPG/'+path+'.json?auth='+encodeURIComponent(authData.idToken),
   {method,headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  let response=await call();
  if(response.status===401){token.expires=0;authData=await auth(c);response=await call();}
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw Error('Firebase: '+(payload?.error||response.status+' · confira as regras do banco'));
  return payload;
 }
 function reportBadge(t){badge.textContent=t;}
 function active(){return bridge.activeFileId()}
 function currentFile(){const id=active();return id?{id,...bridge.readFile(id)}:null;}
 async function fileKey(c,file){
  const id=await auth(c),raw=new TextEncoder().encode(id.uid+'|'+normalize(file.label));
  const hash=await crypto.subtle.digest('SHA-256',raw);
  return Array.from(new Uint8Array(hash).slice(0,18),x=>x.toString(16).padStart(2,'0')).join('');
 }
 async function pushFile(file,c=config,silent=false){
  if(!file||!c||c.mode!=='player')return;
  const identity=await auth(c);const itemKey=await fileKey(c,file);
  const path=c.room+'/files/'+identity.uid+'/'+itemKey;
  const data={label:String(file.label||'FILE').slice(0,48),playerName:c.playerName||'Jogador',character:file.character,updatedAt:{'.sv':'timestamp'}};
  if(JSON.stringify(data).length>450000)throw Error('A ficha excedeu 450 KB; reduza imagens anexadas.');
  await query(c,path,'PUT',data);
  bindings[file.id]={room:c.room,key:itemKey,url:c.databaseURL,shared:true};
  save(BIND_KEY,bindings);
  reportBadge('✓ COMPARTILHADO');
  if(!silent)report('Enviado! Esta ficha continuará sincronizando automaticamente quando você editá-la.');
 }
 let sharing=false;
 async function shareActive(){
  const file=currentFile();
  if(!file){alert('Abra um FILE antes de compartilhar.');return;}
  if(!config||config.mode!=='player'){mode.value='player';modeChange();fill();dialog.showModal();report('Configure a conexão de jogador e clique CONECTAR / SALVAR.');return;}
  if(sharing)return;sharing=true;
  reportBadge('ENVIANDO…');
  try{await pushFile(file,config);report('Arquivo '+file.label+' enviado e associado a este jogador.');}
  catch(e){report(errorText(e),true);reportBadge('ERRO DE ENVIO');dialog.showModal();}
  finally{sharing=false;}
 }
 q('deltaShareActive').addEventListener('click',shareActive);
 window.addEventListener('delta-rpg:save',e=>{
  if(config?.mode!=='player')return;
  const id=e.detail?.fileId,link=bindings[id];
  if(!link||link.room!==config.room||link.url!==config.databaseURL)return;
  clearTimeout(pushTimer);pushFileId=id;
  pushTimer=setTimeout(async()=>{
   if(pushFileId!==active())return;
   try{const file={id,...bridge.readFile(id)};if(file.character)await pushFile(file,config,true);}
   catch(err){reportBadge('⚠ NÃO SINCRONIZADO');console.warn('Envio pendente:',err);}
  },1800);
 });
 async function loadOwner(){
  if(!config||config.mode!=='owner')return;
  const identity=await auth(config);
  const savedOwner=await query(config,config.room+'/ownerUid');
  if(!savedOwner){
   await query(config,config.room+'/ownerUid','PUT',identity.uid);
  }else if(savedOwner!==identity.uid){throw Error('Este grupo pertence a outra conta de mestre neste banco.');}
  const data=await query(config,config.room+'/files');
  records={};
  for(const [uid,files] of Object.entries(data||{})){
   if(!files||typeof files!=='object')continue;
   for(const [key,value] of Object.entries(files)){
    if(value?.character&&typeof value.character==='object')records[uid+'/'+key]={...value,remoteKey:uid+'/'+key};
   }
  }
  save(CACHE_KEY,{room:config.room,url:config.databaseURL,records});
  renderOwner();reportBadge('▣ DONO · '+Object.keys(records).length);
 }
 function renderOwner(){
  const list=q('ownerReceivedList');list.replaceChildren();
  const items=Object.values(records).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  if(!items.length){list.textContent='Ainda não há fichas recebidas neste grupo.';return;}
  for(const record of items){
   const card=document.createElement('article');card.className='owner-file-card';
   const header=document.createElement('div');header.className='owner-file-copy';
   const title=document.createElement('strong');title.textContent=record.label||'FILE';
   const player=document.createElement('small');player.textContent=(record.playerName||'Jogador')+' · '+(record.character.name||'Personagem')+' · NV '+(record.character.level||1);
   const date=document.createElement('small');date.textContent='Atualizado: '+(record.updatedAt?new Date(record.updatedAt).toLocaleString('pt-BR'):'agora');
   header.append(title,player,date);
   const apply=document.createElement('button');apply.type='button';apply.textContent='ABRIR / ATUALIZAR EM FILES';
   apply.addEventListener('click',()=>{
    const result=window.DeltaRpgMasterBridge?.upsertReceived?.(record,config.room+'/'+record.remoteKey);
    if(!result){report('Limite do armazenamento local atingido. A ficha continua acessível no arquivo DONO.',true);return;}
    report(result.created?'Ficha adicionada aos seus FILES.':'Mesmo FILE atualizado sem duplicar.');
   });
   card.append(header,apply);list.append(card);
  }
 }
 async function connect(){
  try{
   const next=collect();config=next;save(CONFIG_KEY,config);
   // Account credentials are per Firebase project and persist separately from current browser tab.
   await auth(next);
   if(next.mode==='owner'){
    await loadOwner();report('Arquivo DONO conectado. Recebimentos disponíveis mesmo quando este navegador estiver fechado.');
    q('ownerListWrap').hidden=false;
    window.DeltaRpgMasterBridge?.ensureOwnerFile?.();
    if(!poll)poll=setInterval(()=>{if(config?.mode==='owner')loadOwner().catch(e=>reportBadge('⚠ CONEXÃO'));},18000);
   }else{
    if(poll){clearInterval(poll);poll=null;}
    report('Jogador conectado. Abra seu FILE e use COMPARTILHAR FILE ATIVO para autorizar a sincronização.');
    reportBadge('JOGADOR CONECTADO');
    q('ownerListWrap').hidden=true;
   }
  }catch(e){report(errorText(e),true);}
 }
 q('ownerConnect').addEventListener('click',connect);
 q('ownerGenerate').addEventListener('click',()=>{room.value=randomCode();report('Código do grupo gerado. Agora conecte para registrar este grupo.');});
 q('ownerInvite').addEventListener('click',async()=>{
  try{const c=collect();if(c.mode!=='owner')throw Error('Use o modo MESTRE.');
   const url=new URL(location.href);url.search='';
   url.searchParams.set('deltaDb',c.databaseURL);url.searchParams.set('deltaKey',c.apiKey);url.searchParams.set('deltaRoom',c.room);
   await navigator.clipboard.writeText(url.toString());report('Convite copiado. Envie aos jogadores de confiança.');
  }catch(e){report(errorText(e),true)}
 });
 q('ownerRefresh').addEventListener('click',async()=>{try{await loadOwner();report('Lista atualizada.')}catch(e){report(errorText(e),true);}});
 q('deltaOpenOwner').addEventListener('click',()=>{
  fill();dialog.showModal();
  if(config?.mode==='owner')loadOwner().then(()=>report('Arquivo DONO atualizado.')).catch(e=>report(errorText(e),true));
 });
 fill();
 if(config?.mode==='owner'){
  const cached=get(CACHE_KEY,null);
  if(cached?.room===config.room&&cached?.url===config.databaseURL){records=cached.records||{};renderOwner();reportBadge('▣ DONO · '+Object.keys(records).length);}
  loadOwner().catch(e=>console.warn('Arquivo DONO:',e));
  poll=setInterval(()=>{if(config?.mode==='owner')loadOwner().catch(()=>reportBadge('⚠ CONEXÃO'));},18000);
 }
 if(config?.mode==='player')reportBadge('COMPARTILHAR DISPONÍVEL');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();