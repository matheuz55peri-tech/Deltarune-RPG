/* DELTA RPG — backups locais independentes dos FILES do localStorage. */
(()=>{'use strict';
const DB_NAME='delta-rpg-recovery-backups-v1';
const STORE='archives';
const FORMAT='delta-rpg-full-backup';
const HISTORY_LIMIT=24;
const HISTORY_INTERVAL=15*60*1000;
const $=id=>document.getElementById(id);
function init(){
 const bridge=window.DeltaRpgLiveBridge,tools=$('filesBackupTools');
 if(!bridge||!tools)return;
 const status=$('filesBackupStatus'),historySelect=$('backupHistorySelect');
 const restoreHistoryButton=$('restoreHistoryBackupBtn'),restoreNewerButton=$('restoreNewerBackupBtn');
 let db=null,ready=false,timer=0,candidate=null;
 const records=new Map();
 const labelDate=value=>{
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'data desconhecida':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date);
 };
 function setStatus(message,error=false){
  status.textContent=message;status.dataset.error=String(error);
 }
 function openDatabase(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB'in window)){reject(Error('Este navegador não oferece IndexedDB.'));return}
   const request=indexedDB.open(DB_NAME,1);
   request.onupgradeneeded=()=>{
    const database=request.result;
    if(!database.objectStoreNames.contains(STORE))database.createObjectStore(STORE,{keyPath:'id'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('Não foi possível abrir o armazenamento de backup.'));
   request.onblocked=()=>reject(Error('Feche outra aba do Delta RPG para ativar os backups.'));
  });
 }
 function readRecord(id){
  return new Promise((resolve,reject)=>{
   const transaction=db.transaction(STORE,'readonly'),request=transaction.objectStore(STORE).get(id);
   request.onsuccess=()=>resolve(request.result||null);
   request.onerror=()=>reject(request.error||Error('Falha ao ler backup.'));
   transaction.onerror=()=>reject(transaction.error||Error('Falha ao ler o armazenamento de backup.'));
  });
 }
 function readAllRecords(){
  return new Promise((resolve,reject)=>{
   const transaction=db.transaction(STORE,'readonly'),request=transaction.objectStore(STORE).getAll();
   request.onsuccess=()=>resolve(request.result||[]);
   request.onerror=()=>reject(request.error||Error('Falha ao listar backups.'));
   transaction.onerror=()=>reject(transaction.error||Error('Falha ao listar o armazenamento de backup.'));
  });
 }
 function renderHistory(all){
  records.clear();historySelect.replaceChildren();
  const initial=document.createElement('option');initial.value='';initial.textContent='Backups anteriores...';historySelect.append(initial);
  const entries=all.filter(item=>item.id!=='latest'&&item.archive).sort((a,b)=>b.savedAt-a.savedAt);
  for(const entry of entries){
   records.set(entry.id,entry);
   const option=document.createElement('option');option.value=entry.id;
   const active=entry.archive.slots?.find(slot=>slot.id===entry.archive.activeId);
   const name=active?.data?.name||active?.label||'FILE';
   option.textContent=`${labelDate(entry.savedAt)} · ${name} · ${entry.archive.slots?.length||0} FILE(s)`;
   historySelect.append(option);
  }
  restoreHistoryButton.disabled=!entries.length;
  return entries;
 }
 async function saveArchive(archive,forceHistory=false){
  if(!db||!archive)return {latest:false};
  const copy=JSON.parse(JSON.stringify(archive)),savedAt=Date.now();
  return new Promise((resolve,reject)=>{
   const transaction=db.transaction(STORE,'readwrite'),store=transaction.objectStore(STORE);
   let latestSaved=false;
   const allRequest=store.getAll();
   allRequest.onsuccess=()=>{
    const all=allRequest.result||[],latest=all.find(item=>item.id==='latest');
    const same=latest&&latest.revision===copy.revision&&JSON.stringify(latest.archive)===JSON.stringify(copy);
    if(!latest||copy.revision>latest.revision||same){
     if(!same){
      store.put({id:'latest',revision:copy.revision,savedAt,archive:copy});
      latestSaved=true;
     }
    }
    const history=all.filter(item=>item.id!=='latest').sort((a,b)=>b.savedAt-a.savedAt);
    const hasSnapshot=history.length>0;
    if(forceHistory||!hasSnapshot||savedAt-history[0].savedAt>=HISTORY_INTERVAL){
     const id='snapshot-'+savedAt+'-'+Math.random().toString(36).slice(2,7);
     store.put({id,revision:copy.revision,savedAt,archive:copy});
     history.unshift({id,savedAt});
    }
    for(const entry of history.slice(HISTORY_LIMIT))store.delete(entry.id);
   };
   allRequest.onerror=()=>{try{transaction.abort()}catch{}};
   transaction.oncomplete=()=>resolve({latest:latestSaved});
   transaction.onerror=()=>reject(transaction.error||Error('Não foi possível gravar o backup automático.'));
   transaction.onabort=()=>reject(transaction.error||Error('A gravação do backup automático foi cancelada.'));
  });
 }
 async function refreshHistory(){
  try{renderHistory(await readAllRecords())}
  catch(error){console.warn('Falha ao listar backups automáticos',error)}
 }
 function downloadBackup(archive){
  const bundle={format:FORMAT,version:1,app:'DELTA RPG',exportedAt:new Date().toISOString(),archive};
  const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download='DELTA-RPG-backup-completo-'+new Date().toISOString().slice(0,10)+'.delta-backup';
  document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 }
 async function restore(archive,label){
  const current=bridge.readArchive();
  if(current)try{await saveArchive(current,true)}catch(error){console.warn('Backup antes da recuperação falhou',error)}
  let latest=null;
  try{if(db)latest=await readRecord('latest')}
  catch(error){
   console.error('Não foi possível verificar a revisão do backup antes de restaurar',error);
   setStatus('Não foi possível conferir o backup mais recente. Tente novamente antes de restaurar.',true);
   return false;
  }
  if(!bridge.restoreArchive(archive,{minimumRevision:latest?.revision||0})){
   setStatus('Esse backup está inválido ou não contém FILEs recuperáveis.',true);return false;
  }
  candidate=null;restoreNewerButton.hidden=true;
  setStatus(`${label} restaurado · ${archive.slots.length} FILE(s)`);
  window.dispatchEvent(new CustomEvent('delta-rpg:backup-restored'));
  try{await saveArchive(bridge.readArchive(),true);await refreshHistory()}
  catch(error){console.warn('Não foi possível atualizar o backup após recuperar',error)}
  return true;
 }
 function scheduleBackup(immediate=false){
  if(!ready)return;
  clearTimeout(timer);
  setStatus('Salvando backup automático independente...');
  timer=setTimeout(async()=>{
   try{
    const archive=bridge.readArchive();if(!archive)return;
    const result=await saveArchive(archive);
    const latest=await readRecord('latest');
    if(latest&&latest.revision>archive.revision){
     setStatus('Há um backup mais recente disponível para recuperação.',true);
    }else if(!result.latest&&latest&&latest.revision===archive.revision&&
      JSON.stringify(latest.archive)!==JSON.stringify(archive)){
     setStatus('Há duas versões deste FILE; confira o histórico de backups.',true);
    }else{
     setStatus(`Backup automático salvo · ${labelDate(Date.now())} · ${archive.slots.length} FILE(s)`);
    }
    await refreshHistory();
   }catch(error){
    console.error('Backup automático falhou',error);
    setStatus('Falha no backup automático. Baixe um backup completo agora.',true);
   }
  },immediate?0:900);
 }
 $('downloadFullBackupBtn').addEventListener('click',()=>{
  const archive=bridge.readArchive();if(!archive){setStatus('Nenhum FILE disponível para exportar.',true);return}
  downloadBackup(archive);setStatus(`Backup completo exportado · ${archive.slots.length} FILE(s), incluindo os murais.`);
 });
 $('importFullBackupBtn').addEventListener('click',()=>$('importFullBackupInput').click());
 $('importFullBackupInput').addEventListener('change',async event=>{
  const input=event.currentTarget,file=input.files?.[0];input.value='';if(!file)return;
  if(file.size>50000000){setStatus('O backup passa do limite de 50 MB.',true);return}
  try{
   const bundle=JSON.parse(await file.text());
   if(bundle?.format!==FORMAT||bundle.version!==1||!Array.isArray(bundle.archive?.slots))
    throw Error('Formato de backup incompatível.');
   if(!confirm(`Substituir todos os FILEs locais pelos ${bundle.archive.slots.length} FILE(s) deste backup?`))return;
   await restore(bundle.archive,'Backup do arquivo');
  }catch(error){console.warn('Backup rejeitado',error);setStatus(error.message||'Não foi possível abrir esse backup.',true)}
 });
 historySelect.addEventListener('change',()=>{restoreHistoryButton.disabled=!records.has(historySelect.value)});
 restoreHistoryButton.addEventListener('click',async()=>{
  const entry=records.get(historySelect.value);if(!entry)return;
  if(!confirm(`Recuperar a versão de ${labelDate(entry.savedAt)}? O estado atual será mantido em outro backup.`))return;
  await restore(entry.archive,'Versão anterior');
 });
 restoreNewerButton.addEventListener('click',async()=>{
  if(!candidate)return;
  if(!confirm(`Recuperar o backup automático de ${labelDate(candidate.savedAt)}? O estado atual será mantido no histórico.`))return;
  await restore(candidate.archive,'Backup automático');
 });
 window.addEventListener('delta-rpg:save',event=>scheduleBackup(event.detail?.storageFailed===true));
 window.addEventListener('delta-rpg:archive-change',()=>scheduleBackup());
 window.addEventListener('pagehide',()=>scheduleBackup(true));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')scheduleBackup(true)});
 (async()=>{
  const initial=bridge.readArchive(),initialFingerprint=JSON.stringify(initial);
  try{
   db=await openDatabase();
   const latest=await readRecord('latest');
   if(latest?.archive&&Number.isSafeInteger(latest.revision)){
    const current=bridge.readArchive(),unchanged=JSON.stringify(current)===initialFingerprint;
    if(latest.revision>current.revision||
      latest.revision===current.revision&&JSON.stringify(latest.archive)!==JSON.stringify(current)){
     if(unchanged&&bridge.restoreArchive(latest.archive,{recovery:true})){
      setStatus(`Rollback evitado: backup automático de ${labelDate(latest.savedAt)} recuperado.`);
      window.dispatchEvent(new CustomEvent('delta-rpg:backup-restored'));
     }else{
      candidate=latest;restoreNewerButton.hidden=false;
      setStatus('Encontramos uma versão de backup diferente. Confira antes de continuar.',true);
      if(latest.revision>current.revision)await saveArchive(current,true);
     }
    }
   }
   ready=true;
   window.dispatchEvent(new CustomEvent('delta-rpg:backup-ready',
    {detail:{minimumRevision:Number.isSafeInteger(latest?.revision)?latest.revision:0}}));
   await refreshHistory();
   if(!candidate){
    const archive=bridge.readArchive();
    const result=await saveArchive(archive);
    const saved=await readRecord('latest');
    if(saved&&saved.revision>archive.revision){
     candidate=saved;restoreNewerButton.hidden=false;
     setStatus('Encontramos um backup mais recente para recuperar.',true);
    }else if(result.latest||saved&&JSON.stringify(saved.archive)===JSON.stringify(archive)){
     setStatus(`Backup automático ativo · ${labelDate(saved?.savedAt||Date.now())} · ${archive.slots.length} FILE(s)`);
    }else{
     setStatus('O backup automático está verificando versões anteriores.');
    }
    await refreshHistory();
   }
   if(navigator.storage?.persisted&&navigator.storage?.persist)try{
    const persistent=await navigator.storage.persisted();
    if(!persistent)await navigator.storage.persist();
   }catch(error){console.warn('O navegador não confirmou armazenamento persistente; os backups locais continuam ativos.',error)}
  }catch(error){
   console.error('Armazenamento de backup automático indisponível',error);
   ready=false;
   window.dispatchEvent(new CustomEvent('delta-rpg:backup-ready'));
   setStatus('Backup automático indisponível neste navegador. Baixe um backup completo para guardar seus dados.',true);
  }
 })();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
