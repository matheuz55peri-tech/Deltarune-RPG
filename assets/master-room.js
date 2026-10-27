/* DELTA RPG · Sala do Mestre (sem configuração de banco)
   Sincronização WebRTC ponto a ponto: cada jogador compartilha somente o FILE
   que escolher, e as edições do mestre retornam para esse mesmo FILE. */
(()=>{
'use strict';
const bridge=window.DeltaRpgLiveBridge;
const master=window.DeltaRpgMasterBridge;
const tab=document.getElementById('tab-files');
if(!bridge||!master||!tab||document.getElementById('deltaMasterRoom'))return;
const STORAGE='delta-rpg-master-room-v1';
const PLAYER_KEY='delta-rpg-master-player-id-v1';
const BASELINES_KEY='delta-rpg-master-baselines-v1';
const BACKUPS_KEY='delta-rpg-master-backups-v1';
const PREFIX='delta-master-';
const MAX_PLAYERS=5;
const MAX_PACKET=420000;
const $=id=>document.getElementById(id);
const randomHex=(size)=>Array.from(crypto.getRandomValues(new Uint8Array(size)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
const makeCode=()=>randomHex(12);
const readLocal=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(_){return fallback}};
const saveLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
const safeLabel=(s,max=48)=>String(s||'').trim().slice(0,max);
const fingerprint=(file)=>JSON.stringify(file?.character||null);
const hashCharacter=character=>{
 const s=JSON.stringify(character||null);let n=2166136261;
 for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);
 return(n>>>0).toString(36);
};
const baselineKey=(code,id)=>code+'|'+playerId+'|'+id;
function getBaseline(code,id){return readLocal(BASELINES_KEY,{})[baselineKey(code,id)]||''}
function setBaseline(code,id,character){
 const saved=readLocal(BASELINES_KEY,{});saved[baselineKey(code,id)]=hashCharacter(character);
 saveLocal(BASELINES_KEY,saved);
}
function backupKey(code,id){return code+'|'+playerId+'|'+id}
function latestBackup(){return readLocal(BACKUPS_KEY,{})[backupKey(settings.code,settings.fileId)]||null}
function refreshBackupButton(){
 const btn=$('dmBackup');if(btn)btn.hidden=!latestBackup();
}
function keepOldVersion(code,id,file){
 // Store at most one version per shared FILE; never generate a new FILE slot.
 const key=backupKey(code,id);
 try{
  const old=readLocal(BACKUPS_KEY,{});
  old[key]={label:file.label,character:file.character,savedAt:new Date().toISOString()};
  const keys=Object.keys(old);
  while(keys.length>10)delete old[keys.shift()];
  localStorage.setItem(BACKUPS_KEY,JSON.stringify(old));
  refreshBackupButton();
  return true;
 }catch(e){console.warn('Não foi possível guardar a versão anterior',e);return false}
}
const recordKey=(code,pid)=>'sala-'+code+'-'+pid;
const getArchived=(source)=>{try{const a=JSON.parse(localStorage.getItem('delta-rpg-save-files-v1')||'null');return a?.slots?.find(x=>x.remoteSource===source)||null}catch(_){return null}};
let settings=readLocal(STORAGE,{mode:'',code:'',name:'',active:false,fileId:''});
const queryCode=new URLSearchParams(location.search).get('deltaSala');
if(queryCode&&/^[A-F0-9]{24}$/i.test(queryCode))settings={...settings,mode:'player',code:queryCode.toUpperCase(),active:false};
let playerId=localStorage.getItem(PLAYER_KEY);
if(!/^[A-F0-9]{24}$/i.test(playerId||'')){playerId=randomHex(12);localStorage.setItem(PLAYER_KEY,playerId)}
let mode='off',room='',peer=null,connection=null,joinedFileId=null,connected=false;
let sessions=new Map(),retryTimer=null,editTimer=null,sequence=0,playerLast='',notice='',explicitStop=false;
let peerLoader=null;
const ui=document.createElement('section');ui.id='deltaMasterRoom';
ui.innerHTML=[
 '<div class="dm-head"><div><span class="dm-eyebrow">✦ DELTA RPG · MULTIJOGADOR</span>',
 '<h2>SALA DO MESTRE</h2><p>Edite as fichas dos jogadores e envie as alterações automaticamente.</p></div>',
 '<span id="dmBadge" class="dm-badge">DESCONECTADO</span></div>',
 '<div class="dm-actions"><button id="dmStart" type="button">✦ CRIAR SALA</button>',
 '<button id="dmJoinOpen" type="button">↳ ENTRAR COMO JOGADOR</button>',
 '<button id="dmResume" type="button" hidden>↻ REABRIR SALA</button>',
 '<button id="dmBackup" type="button" hidden>↓ BAIXAR VERSÃO ANTERIOR</button>',
 '<button id="dmStop" type="button" hidden>DESCONECTAR</button></div>',
 '<div id="dmSession" class="dm-session" hidden>',
 '<div><small>SEU CÓDIGO DE CONVITE</small><strong id="dmRoomCode"></strong></div>',
 '<button id="dmCopy" type="button">COPIAR CONVITE</button></div>',
 '<p id="dmHint" class="dm-hint" role="status" aria-live="polite">Crie uma sala ou entre usando um convite. Sem Firebase ou chaves.</p>',
 '<div id="dmPlayers" class="dm-players" hidden><div class="dm-players-title">FICHAS DOS JOGADORES <span id="dmCount">0/5</span></div>',
 '<div id="dmPlayerList"></div></div>',
 '<details class="dm-details"><summary>Outras formas de compartilhar</summary><p>A Sala do Mestre funciona ao vivo, enquanto mestre e jogador estão conectados. Para guardar cópias na nuvem, existe o arquivo Firebase anterior, com configuração própria.</p><button type="button" id="dmLegacy">ABRIR ARQUIVO FIREBASE (AVANÇADO)</button></details>'
].join('');
tab.prepend(ui);
const legacy=document.getElementById('delta-owner-zone');if(legacy)legacy.hidden=true;
const toolbar=document.createElement('button');
toolbar.id='dmTopButton';toolbar.type='button';toolbar.className='reset-top';
toolbar.textContent='✦ SALA DO MESTRE';
const top=document.querySelector('.top-right');
if(top)top.append(toolbar);
const dialog=document.createElement('dialog');dialog.id='dmDialog';
dialog.innerHTML=[
 '<div class="dm-dialog-body"><div class="dm-dialog-head"><h2>↳ ENTRAR NA SALA</h2>',
 '<button type="button" id="dmClose" aria-label="Fechar">×</button></div>',
 '<p>Abra o FILE do seu personagem antes de conectar. Apenas essa ficha será compartilhada com o mestre.</p>',
 '<label>CÓDIGO DA SALA<input id="dmCodeInput" maxlength="24" placeholder="CÓDIGO DE 24 CARACTERES" autocomplete="off" spellcheck="false"></label>',
 '<label>SEU NOME DE JOGADOR<input id="dmNameInput" maxlength="36" placeholder="Como o mestre vai te reconhecer" autocomplete="nickname"></label>',
 '<p id="dmSelectedFile"></p><button id="dmConnect" type="button">✦ CONECTAR MINHA FICHA</button>',
 '<p class="dm-footnote">A sincronização acontece nos dois sentidos. O mestre poderá modificar o FILE escolhido, e você receberá as mudanças enquanto estiverem conectados.</p></div>'
].join('');
document.body.append(dialog);
function report(message,error=false){
 notice=message;
 const label=$('dmHint');label.textContent=message;label.dataset.error=error?'true':'false';
}
function refresh(){
 const on=mode!=='off';
 $('dmStart').hidden=on;
 $('dmJoinOpen').hidden=on;
 $('dmStop').hidden=!on;
 $('dmResume').hidden=on||!settings.code||settings.mode!=='owner';
 $('dmSession').hidden=!on;
 $('dmRoomCode').textContent=room;
 $('dmPlayers').hidden=mode!=='owner';
 $('dmBadge').textContent=mode==='owner'?'MESTRE ONLINE':connected?'JOGADOR CONECTADO':on?'AGUARDANDO CONEXÃO':'DESCONECTADO';
 $('dmBadge').dataset.active=String(on&& (mode==='owner'||connected));
 $('dmStop').textContent=mode==='owner'?'ENCERRAR SALA':'SAIR DA SALA';
 toolbar.textContent=mode==='owner'?'✦ MESTRE · '+sessions.size:
   mode==='player'&&connected?'✦ FICHA CONECTADA':'✦ SALA DO MESTRE';
 $('dmCount').textContent=String(sessions.size)+'/'+MAX_PLAYERS;
}
function renderPlayers(){
 const host=$('dmPlayerList');host.replaceChildren();
 if(!sessions.size){const p=document.createElement('p');p.textContent='Ainda não há jogadores. Compartilhe o convite para receber as fichas.';host.append(p)}
 for(const s of sessions.values()){
  if(!s.ready)continue;
  const c=document.createElement('article');c.className='dm-player';
  const details=document.createElement('div');details.className='dm-player-info';
  const title=document.createElement('strong');title.textContent=s.name||'Jogador';
  const file=bridge.readFile(s.fileId);
  const name=document.createElement('span');name.textContent=(file?.character?.name||'PERSONAGEM')+' · '+(file?.label||'FILE');
  const indicator=document.createElement('small');indicator.textContent=s.conn.open?'● ONLINE · SINCRONIZADO':'○ DESCONECTADO';
  details.append(title,name,indicator);
  const action=document.createElement('button');action.type='button';action.textContent='✎ ABRIR E EDITAR';
  action.onclick=()=>{if(!bridge.openFile?.(s.fileId))report('Não foi possível abrir essa ficha.');else report('Edite o FILE de '+s.name+'. As mudanças serão enviadas automaticamente.')};
  c.append(details,action);host.append(c);
 }
 refresh();
}
function saveSettings(changes){
 settings={...settings,...changes};saveLocal(STORAGE,settings);
}
async function loadPeer(){
 if(typeof window.Peer==='function')return window.Peer;
 if(peerLoader)return peerLoader;
 peerLoader=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
  s.onload=()=>typeof window.Peer==='function'?resolve(window.Peer):reject(Error('Biblioteca de conexão indisponível.'));
  s.onerror=()=>reject(Error('Não foi possível carregar o serviço de conexão.'));document.head.appendChild(s);
 }).catch(e=>{peerLoader=null;throw e});
 return peerLoader;
}
function validPacket(msg){
 if(!msg||typeof msg!=='object'||Array.isArray(msg))return false;
 try{return JSON.stringify(msg).length<=MAX_PACKET}catch(_){return false}
}
function emit(conn,data){
 if(!conn?.open||!validPacket(data))return false;
 try{conn.send(data);return true}catch(e){console.warn('Sala do Mestre: envio falhou',e);return false}
}
function disconnect(resetSaved=true){
 clearTimeout(retryTimer);clearTimeout(editTimer);retryTimer=null;editTimer=null;
 explicitStop=true;sequence++;
 for(const s of sessions.values())try{s.conn.close()}catch(_){}
 sessions.clear();
 try{connection?.close()}catch(_){}
 connection=null;
 try{peer?.destroy()}catch(_){}
 peer=null;
 mode='off';room='';joinedFileId=null;connected=false;playerLast='';
 if(resetSaved)saveSettings({active:false});
 refresh();renderPlayers();
}
function linkFor(code){
 const u=new URL(location.href);u.search='';u.hash='';
 u.searchParams.set('deltaSala',code);return u.toString();
}
async function copyInvite(){
 if(!room)return;
 const invite=linkFor(room);
 try{await navigator.clipboard.writeText(invite);report('Convite copiado! Envie o link aos jogadores.');}
 catch(_){try{window.prompt('Copie este link:',invite)}catch(e){}}
}
function getFile(){
 return joinedFileId?bridge.readFile(joinedFileId):null;
}
function remoteWrite(fileId,character){
 if(!validPacket({character}))return false;
 return bridge.writeRemoteFile(fileId,character);
}
function onHostConnection(c){
 if(mode!=='owner'){try{c.close()}catch(_){}return;}
 let playerSession=null;
 c.on('data',msg=>{
  if(!validPacket(msg))return;
  if(!playerSession){
   if(msg.kind!=='hello'||!/^[A-F0-9]{24}$/i.test(msg.playerId||'')||!msg.character)return;
   const pid=msg.playerId.toUpperCase();
   const current=sessions.get(pid);
   if(!current&&sessions.size>=MAX_PLAYERS){emit(c,{kind:'full'});c.close();return;}
   if(current){try{current.conn.close()}catch(_){}sessions.delete(pid)}
   const source=recordKey(room,pid);
   let saved=getArchived(source);
   let fileId=saved?.id;
   const incoming={label:safeLabel(msg.label,36),playerName:safeLabel(msg.name,36),character:msg.character};
   if(!saved){
    // Find the original FILE by character/player name and bind it permanently.
    // Never make another copy if a unique matching FILE already exists.
    const occupied=[...sessions.values()].map(s=>s.fileId);
    const received=master.upsertReceived(incoming,source,occupied);
    if(!received){emit(c,{kind:'error',message:'Não foi possível associar a ficha. Verifique o limite de FILES ou se existem fichas repetidas com o mesmo nome.'});c.close();return;}
    fileId=received.id;
    report(received.linkedByName?'✓ FILE existente associado automaticamente a '+(incoming.character.name||incoming.playerName)+'.':'✓ Ficha de '+(incoming.character.name||incoming.playerName)+' recebida.');
   }else{
    // If the master has not changed this character since the last sync,
    // an offline edit from the player can safely update this SAME FILE.
    const hostFile=bridge.readFile(fileId);
    const base=typeof msg.lastKnown==='string'?msg.lastKnown:'';
    if(base&&hostFile&&base===hashCharacter(hostFile.character)&&
        hashCharacter(msg.character)!==base){
     const received=master.upsertReceived(incoming,source);
     if(received)fileId=received.id;
    }
   }
   const session={pid,name:safeLabel(msg.name,36)||'Jogador',fileId,conn:c,ready:true,last:''};
   sessions.set(pid,session);playerSession=session;
   const file=bridge.readFile(fileId);
   if(!file){emit(c,{kind:'error',message:'O FILE compartilhado não foi encontrado.'});c.close();return;}
   session.last=fingerprint(file);
   emit(c,{kind:'snapshot',label:file.label,character:file.character});
   report('Jogador conectado: '+session.name+'. Abra a ficha para editar.');
   renderPlayers();
   return;
  }
  if(msg.kind!=='update'||!msg.character||!playerSession.fileId)return;
  const source=recordKey(room,playerSession.pid);
  const next=fingerprint({character:msg.character});
  if(next===playerSession.last)return;
  const received=master.upsertReceived({label:safeLabel(msg.label,36)||'FILE',character:msg.character},source);
  if(!received){emit(c,{kind:'error',message:'O mestre não conseguiu salvar a atualização.'});return;}
  playerSession.fileId=received.id;
  playerSession.last=next;
  emit(c,{kind:'ack',signature:hashCharacter(msg.character)});
  renderPlayers();
 });
 c.on('close',()=>{
  if(playerSession&&sessions.get(playerSession.pid)===playerSession){
   sessions.delete(playerSession.pid);renderPlayers();
   report('Um jogador desconectou. O FILE permanece salvo em seus arquivos.');
  }
 });
 c.on('error',err=>console.warn('Jogador desconectado',err));
}
async function hostRoom(code){
 const run=++sequence;
 disconnect(false);explicitStop=false;sequence=run;
 mode='starting';room=code;connected=false;
 refresh();report('Criando Sala do Mestre...');
 try{
  const Peer=await loadPeer();
  if(explicitStop||run!==sequence)return;
  mode='owner';peer=new Peer(PREFIX+room.toLowerCase());
  peer.on('open',()=>{
   if(mode!=='owner')return;
   saveSettings({mode:'owner',code:room,active:true});
   report('Sala ativa! Copie o convite. Cada jogador aparecerá aqui com sua ficha.');
   refresh();renderPlayers();
  });
  peer.on('connection',onHostConnection);
  peer.on('error',e=>{
   if(mode!=='owner')return;
   report(e.type==='unavailable-id'?'Este código já está sendo usado em outra janela. Encerre a sala anterior.':'Falha na sala: '+(e.type||e.message),true);
   if(e.type==='unavailable-id'){disconnect(false);saveSettings({mode:'owner',code,active:false})}
  });
  refresh();
 }catch(e){disconnect(false);report(e.message,true);}
}
function startHost(){
 const code=/^[A-F0-9]{24}$/.test(settings.code||'')&&settings.mode==='owner'?settings.code:makeCode();
 hostRoom(code);
}
function planReconnect(){
 if(mode!=='player'||explicitStop||retryTimer)return;
 retryTimer=setTimeout(()=>{
  retryTimer=null;
  if(mode!=='player'||explicitStop)return;
  const code=room,id=joinedFileId;joinRoom(code,id,true);
 },5000);
}
async function joinRoom(code,fileId,reconnect=false){
 const file=bridge.readFile(fileId);
 if(!file){report('Abra um FILE válido antes de entrar na sala.',true);return;}
 if(!/^[A-F0-9]{24}$/i.test(code||'')){report('Código de convite inválido.',true);return;}
 const run=++sequence;
 disconnect(false);explicitStop=false;sequence=run;
 mode='player';room=code.toUpperCase();joinedFileId=fileId;connected=false;
 saveSettings({mode:'player',code:room,fileId:joinedFileId,active:true});
 refresh();report(reconnect?'Reconectando ao mestre...':'Procurando Sala do Mestre...');
 try{
  const Peer=await loadPeer();
  if(run!==sequence||explicitStop)return;
  peer=new Peer();
  peer.on('open',()=>{
   if(mode!=='player')return;
   const c=peer.connect(PREFIX+room.toLowerCase(),{serialization:'json',reliable:true});
   connection=c;
   c.on('open',()=>{
    const live=getFile();
    if(!live){report('O FILE compartilhado foi excluído.',true);disconnect();return;}
    emit(c,{kind:'hello',playerId,name:settings.name||'Jogador',label:live.label,character:live.character,lastKnown:getBaseline(room,joinedFileId)});
    report('Conectado. Aguardando a ficha do mestre...');
   });
   c.on('data',msg=>{
    if(!validPacket(msg))return;
    if(msg.kind==='full'){report('Esta sala já tem cinco jogadores.',true);disconnect();return;}
    if(msg.kind==='error'){report(msg.message||'Falha ao sincronizar.',true);return;}
    if(msg.kind==='ack'){
     if(typeof msg.signature==='string'){
      const all=readLocal(BASELINES_KEY,{});
      all[baselineKey(room,joinedFileId)]=msg.signature;
      saveLocal(BASELINES_KEY,all);
     }
     return;
    }
    if(msg.kind==='snapshot'||msg.kind==='update'){
     const before=getFile();
     if(!before){report('O FILE compartilhado não existe mais.',true);return;}
     // One replaceable backup per player FILE in localStorage (not another FILE).
     if(msg.kind==='snapshot'&&fingerprint(before)!==fingerprint({character:msg.character})){
      if(!keepOldVersion(room,joinedFileId,before)){
       report('Seu arquivo difere do mestre. Faça uma exportação manual antes de sincronizar.',true);
       disconnect();return;
      }
     }
     if(!remoteWrite(joinedFileId,msg.character)){report('Não foi possível aplicar a ficha recebida.',true);return;}
     playerLast=fingerprint({character:msg.character});
     setBaseline(room,joinedFileId,msg.character);
     connected=true;report('✓ SINCRONIZADO · a mesma ficha é atualizada sem gerar cópias.');refresh();
    }
   });
   c.on('close',()=>{
    if(mode!=='player'||explicitStop||connection!==c)return;
    connected=false;refresh();report('Conexão perdida. Tentando reconectar automaticamente...');
    planReconnect();
   });
   c.on('error',()=>{if(mode==='player'){report('Não foi possível conectar. Tentando novamente...',true);planReconnect()}});
  });
  peer.on('error',e=>{
   if(mode!=='player')return;
   report('Mestre indisponível. Tentando reconectar automaticamente...',true);planReconnect();
  });
  refresh();
 }catch(e){report(e.message,true);if(mode==='player')planReconnect()}
}
function autoSync(e){
 const id=e?.detail?.fileId;
 if(!id)return;
 clearTimeout(editTimer);
 editTimer=setTimeout(()=>{
  if(mode==='owner'){
   for(const s of sessions.values()){
    if(s.fileId!==id||!s.conn.open)continue;
    const file=bridge.readFile(id);if(!file)continue;
    const sign=fingerprint(file);
    if(sign===s.last)continue;
    if(emit(s.conn,{kind:'update',character:file.character,label:file.label})){
     s.last=sign;report('✓ Atualização enviada automaticamente para '+s.name+'.');
    }
   }
  }else if(mode==='player'&&connected&&joinedFileId===id&&connection?.open){
   const file=getFile();if(!file)return;
   const sign=fingerprint(file);
   if(sign===playerLast)return;
   if(emit(connection,{kind:'update',character:file.character,label:file.label})){
    playerLast=sign;report('✓ Alterações da sua ficha enviadas ao mestre.');
   }
  }
 },350);
}
window.addEventListener('delta-rpg:save',autoSync);
$('dmStart').onclick=startHost;
$('dmResume').onclick=()=>hostRoom(settings.code);
$('dmJoinOpen').onclick=()=>{
 $('dmCodeInput').value=settings.mode==='player'?settings.code||'':queryCode||'';
 $('dmNameInput').value=settings.name||'';
 const file=bridge.readFile(bridge.activeFileId());
 $('dmSelectedFile').textContent='FILE selecionado: '+(file?.label||'nenhum')+' · '+(file?.character?.name||'PERSONAGEM');
 dialog.showModal();
};
$('dmConnect').onclick=()=>{
 const code=$('dmCodeInput').value.replace(/[\s-]/g,'').toUpperCase();
 const name=safeLabel($('dmNameInput').value,36);
 if(!name){report('Digite seu nome de jogador.',true);return;}
 if(!/^[A-F0-9]{24}$/.test(code)){report('Informe um código de sala válido.',true);return;}
 const id=bridge.activeFileId();
 if(!bridge.readFile(id)){report('Selecione seu FILE antes de conectar.',true);return;}
 saveSettings({name,mode:'player',code});
 dialog.close();joinRoom(code,id);
};
$('dmClose').onclick=()=>dialog.close();
$('dmStop').onclick=()=>{disconnect();report('Desconectado. Os FILES locais foram preservados.');};
$('dmCopy').onclick=copyInvite;
$('dmBackup').onclick=()=>{
 const backup=latestBackup();
 if(!backup){report('Não há versão anterior guardada.',true);return;}
 const data={format:'delta-rpg-file-v1',exportedAt:backup.savedAt,
  file:{label:backup.label},character:backup.character};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='DELTA-RPG-versao-anterior.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
 report('Versão anterior exportada. Nenhum FILE novo foi criado.');
};
refreshBackupButton();
$('dmLegacy').onclick=()=>document.getElementById('deltaOpenOwner')?.click();
toolbar.onclick=()=>{
 if(mode==='off'&&queryCode&&/^[A-F0-9]{24}$/i.test(queryCode))$('dmJoinOpen').click();
 else {document.querySelector('[data-tab="files"]')?.click();ui.scrollIntoView({behavior:'smooth',block:'start'})}
};
window.addEventListener('beforeunload',()=>{try{peer?.destroy()}catch(_){}});
refresh();
if(queryCode&&/^[A-F0-9]{24}$/i.test(queryCode)){
 report('Convite reconhecido! Abra seu FILE e clique em ENTRAR COMO JOGADOR.');
 $('dmJoinOpen').click();
}else if(settings.active&&settings.code){
 if(settings.mode==='owner')hostRoom(settings.code);
 else if(settings.mode==='player'&&bridge.readFile(settings.fileId))joinRoom(settings.code,settings.fileId,true);
}else if(settings.mode==='owner'&&settings.code)refresh();
})();