/* DELTA RPG · Initiative tracker — peer-to-peer, authoritative master rolls.
   A separate module to avoid touching FILES, equipment or character saving. */
(()=>{
'use strict';
const KEY='delta-rpg-initiative-sessions-v1',LIMIT=30;
const $=id=>document.getElementById(id);
const safe=(text,max=48)=>String(text||'').trim().slice(0,max);
const clean=(value)=>{
 if(!value||!Number.isSafeInteger(value.round)||value.round<1||value.round>99999||
  !Array.isArray(value.rolls))return null;
 const seen=new Set(),rolls=[];
 for(const r of value.rolls.slice(0,LIMIT)){
  if(!r||typeof r.pid!=='string'||!/^[A-Fa-f0-9]{24}$/.test(r.pid)||
   seen.has(r.pid.toUpperCase())||!Number.isInteger(r.die)||r.die<1||r.die>20||
   !Number.isInteger(r.agility)||r.agility<0||r.agility>50000||
   !Number.isInteger(r.total)||r.total!==r.die+r.agility)continue;
  seen.add(r.pid.toUpperCase());
  rolls.push({pid:r.pid.toUpperCase(),playerName:safe(r.playerName,36)||'Jogador',
   characterName:safe(r.characterName)||'Personagem',die:r.die,
   agility:r.agility,total:r.total,
   order:Number.isSafeInteger(r.order)&&r.order>=0?r.order:rolls.length});
 }
 return{round:value.round,rolls};
};
const agi=(character)=>{
 if(!character||typeof character!=='object')return 0;
 const buff=(Array.isArray(character.activeBuffs)?character.activeBuffs:[])
  .filter(x=>x&&x.target==='agility')
  .reduce((n,x)=>n+Math.trunc(Number(x.amount)||0),0);
 const equipped=character.equipment&&typeof character.equipment==='object'?
  Object.values(character.equipment):[];
 const equipment=equipped.filter(Boolean).reduce((n,x)=>n+
  (Array.isArray(x.bonuses)?x.bonuses:[])
   .filter(b=>b&&b.stat==='agility')
   .reduce((sum,b)=>sum+Math.trunc(Number(b.value)||0),0),0);
 return Math.max(0,Math.min(50000,Math.trunc(Number(character.agility)||0)+buff+equipment));
};
function d20(){
 // Rejection sampling avoids modulo bias.
 const max=0x100000000,ceiling=max-(max%20),a=new Uint32Array(1);
 do{crypto.getRandomValues(a)}while(a[0]>=ceiling);
 return(a[0]%20)+1;
}
const standings=()=>[...state.rolls].sort((a,b)=>
 b.total-a.total||b.agility-a.agility||b.die-a.die||a.order-b.order);
let role='off',room='',mine='',myFile='',ready=false,connected=false,open=false,pending=false;
let state={round:1,rolls:[]},sessions=new Map(),mounted=false;
function persist(){
 if(role!=='host'||!room)return;
 try{
  const all=JSON.parse(localStorage.getItem(KEY)||'{}');
  all[room]=state;
  const keys=Object.keys(all);while(keys.length>12)delete all[keys.shift()];
  localStorage.setItem(KEY,JSON.stringify(all));
 }catch(e){console.warn('Iniciativa: falha ao guardar resultado',e)}
}
function restore(code){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')[code]}catch(_){}
 state=clean(saved)||{round:1,rolls:[]};
}
function send(conn,message){
 if(!conn?.open)return false;
 try{conn.send(message);return true}catch(e){console.warn('Iniciativa: conexão indisponível',e);return false}
}
function snapshot(conn){return send(conn,{kind:'initiative-state',state})}
function broadcast(){
 persist();
 for(const s of sessions.values())snapshot(s.conn);
 draw();
}
function draw(){
 if(!mounted)return;
 const access=role==='host'&&open||role==='player'&&connected;
 const toggle=$('dmInitiativeToggle'),panel=$('dmInitiativePanel');
 toggle.hidden=!access;
 toggle.setAttribute('aria-expanded',String(access&&panel.dataset.open==='yes'));
 panel.hidden=!access||panel.dataset.open!=='yes';
 $('dmInitiativeRound').textContent='RODADA '+String(state.round).padStart(2,'0');
 const list=$('dmInitiativeList');list.replaceChildren();
 const all=standings();
 if(!all.length){
  const item=document.createElement('li');item.className='dm-init-empty';
  item.textContent='Aguardando os jogadores rolarem a iniciativa...';
  list.append(item);
 }
 for(const [i,entry] of all.entries()){
  const li=document.createElement('li');
  li.className='dm-init-item'+(i===0?' dm-init-first':'')+
   (entry.pid===mine&&role==='player'?' dm-init-mine':'');
  const rank=document.createElement('strong');rank.className='dm-init-place';rank.textContent=String(i+1).padStart(2,'0')+'º';
  const identity=document.createElement('div');identity.className='dm-init-identity';
  const character=document.createElement('strong');character.textContent=entry.characterName;
  const player=document.createElement('small');player.textContent='JOGADOR · '+entry.playerName;
  identity.append(character,player);
  const formula=document.createElement('span');formula.className='dm-init-formula';
  formula.textContent='🎲 '+entry.die+' + '+entry.agility+' AGL';
  const score=document.createElement('strong');score.className='dm-init-score';score.textContent=entry.total;
  li.append(rank,identity,formula,score);list.append(li);
 }
 const roll=$('dmInitiativeRoll'),reset=$('dmInitiativeReset'),tip=$('dmInitiativeInfo');
 const self=all.find(x=>x.pid===mine);
 roll.hidden=role!=='player';reset.hidden=role!=='host';
 roll.disabled=!connected||!ready||!!self||pending;
 const character=window.DeltaRpgLiveBridge?.readFile?.(myFile)?.character;
 roll.textContent=self?'✓ INICIATIVA REGISTRADA':pending?'⚄ ROLANDO...':
  '⚄ ROLAR 1D20 + AGL '+(character?agi(character):'');
 if(role==='host'){
  tip.textContent='Todos os jogadores rolados aparecem em ordem decrescente. '+
   all.length+' rolagem(ns) registradas nesta rodada.';
 }else if(!ready)tip.textContent='Aguardando os resultados da sala do mestre...';
 else if(self)tip.textContent='Seu resultado: '+self.die+' + '+self.agility+' AGL = '+self.total+
  '. Aguarde o restante do grupo.';
 else if(pending)tip.textContent='O mestre está processando sua rolagem...';
 else tip.textContent='Cada jogador rola uma vez por rodada. A Agilidade da ficha é somada automaticamente.';
}
function mount(){
 if(mounted||!$('dmResume')||!$('dmHint'))return;
 mounted=true;
 const button=document.createElement('button');button.id='dmInitiativeToggle';button.type='button';button.hidden=true;
 button.textContent='⚄ ROLAGEM DE INICIATIVA';
 button.setAttribute('aria-controls','dmInitiativePanel');
 button.setAttribute('aria-expanded','false');
 $('dmResume').insertAdjacentElement('afterend',button);
 const panel=document.createElement('section');panel.id='dmInitiativePanel';panel.className='dm-init-panel';
 panel.hidden=true;panel.dataset.open='no';panel.setAttribute('aria-label','Rolagem de iniciativa');
 panel.innerHTML=[
 '<div class="dm-init-head"><div><span class="dm-eyebrow">ORDEM DOS TURNOS</span>',
 '<h3>⚄ ROLAGEM DE INICIATIVA</h3></div>',
 '<span id="dmInitiativeRound" class="dm-init-round">RODADA 01</span></div>',
 '<p class="dm-init-info" id="dmInitiativeInfo" role="status" aria-live="polite"></p>',
 '<div class="dm-init-actions"><button type="button" id="dmInitiativeRoll" hidden>⚄ ROLAR 1D20 + AGL</button>',
 '<button type="button" id="dmInitiativeReset" hidden>↻ NOVA RODADA</button></div>',
 '<ol class="dm-init-list" id="dmInitiativeList"></ol>'
 ].join('');
 $('dmHint').insertAdjacentElement('afterend',panel);
 button.onclick=()=>{
  if(button.hidden)return;
  panel.dataset.open=panel.dataset.open==='yes'?'no':'yes';
  draw();
 };
 $('dmInitiativeRoll').onclick=()=>{
  if(role!=='player'||!connected||!ready||pending||
   state.rolls.some(x=>x.pid===mine))return;
  const conn=window.DeltaRpgInitiative.connection?.();
  if(send(conn,{kind:'initiative-roll',round:state.round})){pending=true;draw();}
  else $('dmInitiativeInfo').textContent='Não foi possível enviar a rolagem. Confira a conexão.';
 };
 $('dmInitiativeReset').onclick=()=>{
  if(role!=='host'||!open)return;
  if(!confirm('Iniciar uma nova rodada e limpar os resultados atuais?'))return;
  state={round:state.round>=99999?1:state.round+1,rolls:[]};
  broadcast();
 };
 draw();
}
function refresh(info={}){
 open=role==='host'&&info.mode==='owner'&&!!info.hostReady;
 connected=role==='player'&&info.mode==='player'&&!!info.connected;
 if(!connected)pending=false;
 draw();
}
function stop(){
 role='off';room='';mine='';myFile='';ready=false;connected=false;open=false;pending=false;
 state={round:1,rolls:[]};sessions.clear();
 if(mounted)$('dmInitiativePanel').dataset.open='no';
 draw();
}
function hostStarted(code){
 role='host';room=code;mine='';myFile='';ready=true;pending=false;
 sessions.clear();restore(code);draw();
}
function playerStarted(code,pid,fileId){
 role='player';room=code;mine=pid;myFile=fileId;
 ready=false;connected=false;pending=false;
 sessions.clear();state={round:1,rolls:[]};draw();
}
function hostPlayerJoined(session,conn){
 if(role!=='host'||!session)return;
 sessions.set(session.pid,{session,conn});
 snapshot(conn);
}
function hostPlayerLeft(session){
 if(role!=='host'||!session)return;
 if(sessions.get(session.pid)?.session===session)sessions.delete(session.pid);
}
function hostMessage(message,session,conn){
 if(!message||message.kind!=='initiative-roll')return false;
 if(role!=='host'||!open||!session||session.conn!==conn||!conn.open)return true;
 if(!Number.isInteger(message.round)||message.round!==state.round||
  state.rolls.some(x=>x.pid===session.pid)){snapshot(conn);return true;}
 const character=window.DeltaRpgLiveBridge?.readFile?.(session.fileId)?.character;
 if(!character){snapshot(conn);return true;}
 const die=d20(),agility=agi(character);
 state.rolls.push({pid:session.pid,playerName:session.name||'Jogador',
  characterName:safe(character.name)||'Personagem',die,agility,total:die+agility,order:state.rolls.length});
 broadcast();return true;
}
function playerMessage(message){
 if(!message||message.kind!=='initiative-state')return false;
 if(role!=='player')return true;
 const incoming=clean(message.state);
 if(incoming){
  state=incoming;ready=true;pending=false;draw();
 }
 return true;
}
window.DeltaRpgInitiative=Object.freeze({
 mount,refresh,stop,hostStarted,playerStarted,hostPlayerJoined,hostPlayerLeft,
 hostMessage,playerMessage,
 connection:()=>null
});
})();
