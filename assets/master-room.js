/* DELTA RPG · Sala do Mestre (sem configuração de banco)
   Fichas fluem do jogador para uma visualização somente leitura do mestre. */
(()=>{
'use strict';
const bridge=window.DeltaRpgLiveBridge;
const master=window.DeltaRpgMasterBridge;
const tab=document.getElementById('tab-files');
if(!bridge||!master||!tab||document.getElementById('deltaMasterRoom'))return;
const STORAGE='delta-rpg-master-room-v1';
const PLAYER_KEY='delta-rpg-master-player-id-v1';
const BACKUPS_KEY='delta-rpg-master-backups-v1';
const PREFIX='delta-master-';
const MAX_PLAYERS=5;
const packets=window.DeltaRpgLivePackets;
if(!packets){console.error('Sala do Mestre: transporte de pacotes indisponível.');return;}
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
 '<h2>SALA DO MESTRE</h2><p>Veja as fichas ao vivo. Só o jogador altera e salva a própria ficha.</p></div>',
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
window.DeltaRpgInitiative?.mount?.();
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
 window.DeltaRpgInitiative?.refresh?.({mode,connected,room,hostReady:!!peer?.open});
}
function renderPlayers(){
 const host=$('dmPlayerList');host.replaceChildren();
 if(!sessions.size){const p=document.createElement('p');p.textContent='Ainda não há jogadores. Compartilhe o convite para receber as fichas.';host.append(p)}
 for(const s of sessions.values()){
  if(!s.ready)continue;
  const c=document.createElement('article');c.className='dm-player';
  const details=document.createElement('div');details.className='dm-player-info';
  const title=document.createElement('strong');title.textContent=s.name||'Jogador';
  const name=document.createElement('span');name.textContent=(s.character?.name||'PERSONAGEM')+' · ficha ao vivo';
  const indicator=document.createElement('small');indicator.textContent=s.conn.open?'● ONLINE · SINCRONIZADO':'○ DESCONECTADO';
  details.append(title,name,indicator);
  const action=document.createElement('button');action.type='button';action.textContent='👁 VER FICHA AO VIVO';
  action.onclick=()=>showPlayerSheet(s.pid);
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
 return packets.valid(msg);
}
function emit(conn,data){
 return packets.send(conn,data);
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
 window.DeltaRpgInitiative?.stop?.();
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
const viewer=document.createElement('dialog');viewer.id='dmSheetDialog';
viewer.innerHTML='<div class="dm-sheet-view"><header><div><span class="dm-eyebrow">FICHA DO JOGADOR · SOMENTE LEITURA</span><h2 id="dmSheetTitle"></h2><p id="dmSheetStatus">Recebendo atualizações ao vivo…</p></div><button id="dmSheetClose" type="button" aria-label="Fechar ficha">FECHAR</button></header><div id="dmSheetContent"></div></div>';
document.body.append(viewer);
const viewerStyle=document.createElement('style');
viewerStyle.textContent='#dmSheetDialog{width:min(920px,94vw);max-width:94vw;max-height:88vh;overflow:auto;padding:0;border:1px solid rgba(173,145,226,.65);border-radius:14px;background:#0b0a1a;color:#f5efff;box-shadow:0 24px 90px #000b}#dmSheetDialog::backdrop{background:#03020bcc;backdrop-filter:blur(5px)}.dm-sheet-view{padding:clamp(18px,4vw,36px)}.dm-sheet-view header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #55466d;padding-bottom:18px;margin-bottom:18px}.dm-sheet-view h2{margin:8px 0;font:700 22px monospace}.dm-sheet-view p{margin:0;color:#c5b9d8}.dm-sheet-view button{border:1px solid #8065a3;border-radius:6px;padding:10px 14px;background:#211832;color:#fff;cursor:pointer}.dm-sheet-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:9px;margin:16px 0 24px}.dm-sheet-stat,.dm-sheet-section{padding:14px;border:1px solid #39304c;border-radius:8px;background:#121020}.dm-sheet-stat small{display:block;color:#b5a7c9;font-size:10px;letter-spacing:.1em}.dm-sheet-stat strong{display:block;margin-top:8px}.dm-sheet-sections{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:12px}.dm-sheet-section h3{margin:0 0 12px;color:#c9a9f3;font-size:12px;letter-spacing:.08em}.dm-sheet-entry{padding:9px 0;border-top:1px solid #30283e;overflow-wrap:anywhere;white-space:pre-wrap}.dm-sheet-entry:first-of-type{border-top:0;padding-top:0}.dm-sheet-entry strong{display:block}.dm-sheet-entry small{color:#c5b9d8}.dm-sheet-empty{color:#8e829f}@media(max-width:520px){.dm-sheet-view header{flex-direction:column}.dm-sheet-view header button{align-self:flex-end}}';
document.head.append(viewerStyle);
function appendSheetSection(parent,title,entries,format){
 const section=document.createElement('section');section.className='dm-sheet-section';
 const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
 if(!entries.length){const empty=document.createElement('p');empty.className='dm-sheet-empty';empty.textContent='Nenhum registro.';section.append(empty)}
 for(const entry of entries){
  const row=document.createElement('div');row.className='dm-sheet-entry';
  const parts=format(entry),name=document.createElement('strong');name.textContent=parts.title;row.append(name);
  if(parts.detail){const detail=document.createElement('small');detail.textContent=parts.detail;row.append(detail)}
  if(parts.description){const description=document.createElement('div');description.textContent=parts.description;row.append(description)}
  section.append(row);
 }
 parent.append(section);
}
function showPlayerSheet(pid){
 const session=sessions.get(pid);if(!session?.character)return;
 viewer.dataset.playerId=pid;
 $('dmSheetTitle').textContent=session.character.name||'Personagem';
 $('dmSheetStatus').textContent='Jogador: '+session.name+' · atualizada ao vivo enquanto estiver conectado.';
 const content=$('dmSheetContent');content.replaceChildren();
 const character=session.character,stats=document.createElement('div');stats.className='dm-sheet-stats';
 for(const [label,value] of [['NÍVEL',character.level],['HP',character.hp],['TP',character.tp],['FORÇA',character.strength],['DEFESA',character.defense],['INTELIGÊNCIA',character.intelligence],['AGILIDADE',character.agility]]){
  const stat=document.createElement('div');stat.className='dm-sheet-stat';const caption=document.createElement('small');caption.textContent=label;const number=document.createElement('strong');number.textContent=String(value??0);stat.append(caption,number);stats.append(stat);
 }
 content.append(stats);
 const sections=document.createElement('div');sections.className='dm-sheet-sections';
 appendSheetSection(sections,'INVENTÁRIO',Array.isArray(character.items)?character.items:[],item=>({title:(item.icon||'◆')+' '+(item.name||'Item')+' ×'+(item.quantity||1),description:item.description||''}));
 appendSheetSection(sections,'HABILIDADES',Array.isArray(character.skills)?character.skills:[],skill=>({title:(skill.icon||'✦')+' '+(skill.name||'Habilidade'),detail:'TP '+(skill.cost||0)+' · '+(skill.category||'dano'),description:skill.description||''}));
 appendSheetSection(sections,'EQUIPAMENTOS',Object.entries(character.equipment||{}).filter(([,item])=>item).map(([slot,item])=>({slot,item})),entry=>({title:(entry.item.name||'Item')+' · '+entry.slot,description:entry.item.description||''}));
 appendSheetSection(sections,'RELACIONAMENTOS',Array.isArray(character.relationships)?character.relationships:[],relationship=>({title:relationship.name||'Personagem',detail:relationship.role||'',description:relationship.description||''}));
 appendSheetSection(sections,'MURAL DE DOCUMENTOS',Array.isArray(character.muralNotes)?character.muralNotes:[],note=>({title:note.title||'Bilhete',description:note.text||''}));
 content.append(sections);if(!viewer.open)viewer.showModal();
}
function onHostConnection(c){
 if(mode!=='owner'){try{c.close()}catch(_){}return;}
 let playerSession=null;
 c.on('data',msg=>{
  msg=packets.receive(c,msg);
  if(!msg)return;
  if(!validPacket(msg))return;
  if(!playerSession){
   if(msg.kind!=='hello'||!/^[A-F0-9]{24}$/i.test(msg.playerId||'')||!msg.character)return;
   const pid=msg.playerId.toUpperCase();
   const current=sessions.get(pid);
   if(!current&&sessions.size>=MAX_PLAYERS){emit(c,{kind:'full'});c.close();return;}
   if(current){try{current.conn.close()}catch(_){}sessions.delete(pid)}
   let character;
   try{character=master.normalizeIncoming(msg.character)}
   catch(error){console.warn('Ficha do jogador inválida:',error);emit(c,{kind:'error',message:'A ficha não pôde ser exibida; os dados locais do jogador foram preservados.'});c.close();return;}
   if(!character){emit(c,{kind:'error',message:'A ficha não pôde ser exibida; os dados locais do jogador foram preservados.'});c.close();return;}
   const session={pid,name:safeLabel(msg.name,36)||'Jogador',character,conn:c,ready:true,last:fingerprint({character})};
   sessions.set(pid,session);playerSession=session;
   emit(c,{kind:'ack',signature:hashCharacter(character)});
   window.DeltaRpgInitiative?.hostPlayerJoined?.(session,c);
   report('Ficha ao vivo recebida: '+session.character.name+'. Os dados ficam no dispositivo do jogador.');
   renderPlayers();
   return;
  }
  if(window.DeltaRpgInitiative?.hostMessage?.(msg,playerSession,c))return;
  if(msg.kind!=='update'||!msg.character)return;
  let character;
  try{character=master.normalizeIncoming(msg.character)}
  catch(error){console.warn('Atualização de ficha inválida:',error);emit(c,{kind:'error',message:'Atualização inválida; a ficha local do jogador foi preservada.'});return;}
  if(!character){emit(c,{kind:'error',message:'Atualização inválida; a ficha local do jogador foi preservada.'});return;}
  const next=fingerprint({character});
  if(next===playerSession.last)return;
  playerSession.character=character;
  playerSession.last=next;
  emit(c,{kind:'ack',signature:hashCharacter(character)});
  if(viewer.open&&viewer.dataset.playerId===playerSession.pid)showPlayerSheet(playerSession.pid);
  window.DeltaRpgInitiative?.hostPlayerUpdated?.(playerSession);
  renderPlayers();
 });
 c.on('close',()=>{
  window.DeltaRpgInitiative?.hostPlayerLeft?.(playerSession);
  if(playerSession&&sessions.get(playerSession.pid)===playerSession){
   sessions.delete(playerSession.pid);renderPlayers();
   if(viewer.open&&viewer.dataset.playerId===playerSession.pid)
    $('dmSheetStatus').textContent='Jogador desconectado · exibindo a última ficha recebida.';
   report('Um jogador desconectou. O FILE permanece salvo em seus arquivos.');
  }
 });
 c.on('error',err=>console.warn('Jogador desconectado',err));
}
async function hostRoom(code){
 const run=++sequence;
 disconnect(false);explicitStop=false;sequence=run;
 mode='starting';room=code;connected=false;
 window.DeltaRpgInitiative?.hostStarted?.(code);
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
 window.DeltaRpgInitiative?.playerStarted?.(room,playerId,fileId);
 saveSettings({mode:'player',code:room,fileId:joinedFileId,active:true});
 refreshBackupButton();
 refresh();report(reconnect?'Reconectando ao mestre...':'Procurando Sala do Mestre...');
 try{
  const Peer=await loadPeer();
  if(run!==sequence||explicitStop)return;
  peer=new Peer();
  peer.on('open',()=>{
   if(mode!=='player')return;
   const c=peer.connect(PREFIX+room.toLowerCase(),{serialization:'json',reliable:true});
   connection=c;
   window.DeltaRpgInitiative?.playerConnected?.(c);
   c.on('open',()=>{
    const live=getFile();
    if(!live){report('O FILE compartilhado foi excluído.',true);disconnect();return;}
    playerLast=fingerprint(live);
    if(!emit(c,{kind:'hello',playerId,name:settings.name||'Jogador',label:live.label,character:live.character})){
     report('⚠ Não foi possível enviar sua ficha (limite de 6 MB). O conteúdo permanece salvo neste dispositivo.',true);
     return;
    }
    report('Enviado com segurança. Aguardando confirmação do mestre…');
   });
   c.on('data',msg=>{
    msg=packets.receive(c,msg);
    if(!msg)return;
    if(!validPacket(msg))return;
    if(window.DeltaRpgInitiative?.playerMessage?.(msg))return;
    if(msg.kind==='full'){report('Esta sala já tem cinco jogadores.',true);disconnect();return;}
    if(msg.kind==='error'){report(msg.message||'Falha ao sincronizar.',true);return;}
    if(msg.kind==='ack'){
     if(typeof msg.signature==='string'){
      connected=true;refresh();
      report('✓ CONECTADO · o mestre está vendo sua ficha ao vivo. Seus arquivos continuam no seu dispositivo.');
      if(fingerprint(getFile())!==playerLast)autoSync({detail:{fileId:joinedFileId}});
     }
     return;
    }
    if(msg.kind==='snapshot'||msg.kind==='update'){
     report('Esta versão da sala tentou substituir sua ficha. Para proteger seus dados, a conexão foi encerrada; atualize a página do mestre.',true);
     disconnect();return;
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
  if(mode==='player'&&connected&&joinedFileId===id&&connection?.open){
   const file=getFile();if(!file)return;
   const sign=fingerprint(file);
   if(sign===playerLast)return;
   if(emit(connection,{kind:'update',character:file.character,label:file.label})){
    playerLast=sign;report('✓ Alterações da sua ficha enviadas ao mestre.');
   }else report('⚠ Não foi possível enviar a ficha. Ela continua salva neste dispositivo.',true);
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
$('dmSheetClose').onclick=()=>viewer.close();
$('dmStop').onclick=()=>{disconnect();report('Desconectado. Os FILES locais foram preservados.');};
$('dmCopy').onclick=copyInvite;
$('dmBackup').onclick=()=>{
 const backup=latestBackup();
 if(!backup){report('Não há versão anterior guardada.',true);return;}
 const data={format:'delta-rpg-save',version:1,app:'DELTA RPG',exportedAt:backup.savedAt,
  file:{label:backup.label},character:backup.character};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='DELTA-RPG-versao-anterior.deltarpg';document.body.append(a);a.click();a.remove();
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
}else if(settings.active&&settings.code){
 if(settings.mode==='owner')hostRoom(settings.code);
 else if(settings.mode==='player'&&bridge.readFile(settings.fileId))joinRoom(settings.code,settings.fileId,true);
}else if(settings.mode==='owner'&&settings.code)refresh();
})();