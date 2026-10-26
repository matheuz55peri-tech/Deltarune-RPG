/* DELTA RPG v13: salas P2P para editar uma ficha ao vivo.
   PeerJS Cloud sinaliza o encontro; dados via WebRTC enquanto ambos online. */
(() => {
  'use strict';
  function init() {
    const bridge=window.DeltaRpgLiveBridge;
    if(!bridge||document.getElementById('deltaLiveToggle'))return;
    const $=id=>document.getElementById(id);

    const btn=document.createElement('button');
    btn.id='deltaLiveToggle';btn.className='reset-top';btn.type='button';
    btn.textContent='☍ AO VIVO';btn.title='Compartilhar uma ficha ao vivo';
    const anchor=$('themeControl')||document.querySelector('.top-right');
    if(anchor)anchor.insertAdjacentElement('afterend',btn);
    else document.body.prepend(btn);

    const dialog=document.createElement('dialog');
    dialog.id='deltaLiveDialog';
    dialog.innerHTML=[
      '<div class="delta-live-inner">',
      '<div class="delta-live-head"><h2>✦ FICHA AO VIVO</h2>',
      '<button type="button" id="deltaLiveClose" class="delta-live-close" aria-label="Fechar">×</button></div>',
      '<p>Compartilhe o FILE aberto com outra pessoa. Quem entrar recebe uma ',
      '<strong>cópia independente</strong> nos próprios FILES, sem apagar as outras fichas.</p>',
      '<div id="deltaLiveStatus" class="delta-live-status" role="status" aria-live="polite">',
      'OFFLINE · fichas salvas neste dispositivo.</div>',
      '<button class="delta-live-action" type="button" id="deltaLiveHost">✦ CRIAR SALA</button>',
      '<div class="delta-live-join">',
      '<input id="deltaLiveInput" aria-label="Código de sala" maxlength="20" ',
      'autocomplete="off" spellcheck="false" placeholder="CÓDIGO DA SALA">',
      '<button class="delta-live-action delta-live-secondary" type="button" ',
      'id="deltaLiveJoin">ENTRAR</button></div>',
      '<div id="deltaLiveCodeBox" class="delta-live-code" hidden>',
      '<strong id="deltaLiveRoom"></strong>',
      '<button type="button" class="delta-live-action delta-live-secondary" ',
      'id="deltaLiveCopy">COPIAR CÓDIGO</button></div>',
      '<button class="delta-live-action delta-live-secondary" type="button" ',
      'id="deltaLiveStop" hidden>DESCONECTAR</button>',
      '<p class="delta-live-note">Os navegadores precisam estar abertos e conectados. ',
      'Quando o anfitrião sai, a sala acaba, mas os FILES locais continuam salvos. ',
      'A última edição recebida prevalece se duas pessoas alterarem a mesma coisa ao mesmo tempo.</p>',
      '<p class="delta-live-note">Compartilhe o código somente com pessoas de confiança. ',
      'Não inclua informações pessoais na ficha. Algumas redes bloqueiam WebRTC.</p>',
      '</div>'
    ].join('');
    document.body.append(dialog);

    const status=$('deltaLiveStatus'),hostBtn=$('deltaLiveHost'),joinBtn=$('deltaLiveJoin');
    const stopBtn=$('deltaLiveStop'),input=$('deltaLiveInput');
    let peer=null,hostConn=null,clients=new Set(),mode='offline';
    let sharedId=null,room='',revision=0,lastRevision=-1;
    let applying=false,sending=null,connected=false,serial=0;

    function report(text){status.textContent=text;}
    function refresh(){
      const live=mode!=='offline';
      hostBtn.disabled=live;joinBtn.disabled=live;input.disabled=live;
      stopBtn.hidden=!live;
      $('deltaLiveCodeBox').hidden=mode!=='host';
      btn.dataset.live=String(live);
      btn.textContent=mode==='host'?'☍ AO VIVO · '+clients.size:
        mode==='guest'&&connected?'☍ AO VIVO ✓':'☍ AO VIVO';
    }

    function stop(message){
      clearTimeout(sending);sending=null;
      for(const c of clients){try{c.close()}catch(_){}}
      clients.clear();
      if(hostConn)try{hostConn.close()}catch(_){}
      hostConn=null;
      if(peer)try{peer.destroy()}catch(_){}
      peer=null;mode='offline';sharedId=null;room='';
      revision=0;lastRevision=-1;connected=false;
      refresh();
      report(message||'OFFLINE · as fichas continuam salvas neste dispositivo.');
    }

    function read(){return sharedId?bridge.readFile(sharedId):null;}
    function packageState(){
      const file=read();if(!file)return null;
      const msg={kind:'state',revision,label:file.label,character:file.character};
      if(JSON.stringify(msg).length>220000){
        report('O FILE ultrapassou o limite da sala ao vivo.');
        return null;
      }
      return msg;
    }
    function send(c,data){
      if(!c||!c.open||!data)return false;
      try{c.send(data);return true}catch(err){console.warn('P2P:',err);return false}
    }
    function broadcast(){
      const data=packageState();
      for(const c of clients)send(c,data);
    }
    function flush(){
      if(mode==='offline'||!sharedId)return;
      const file=read();
      if(!file){stop('O FILE compartilhado foi excluído. Sala encerrada.');return;}
      if(mode==='host'){
        revision++;
        broadcast();
        report('SALA ATIVA · '+clients.size+' participante(s) · atualizações enviadas.');
      }else if(hostConn?.open){
        send(hostConn,{kind:'edit',character:file.character});
        report('CONECTADO · alterações enviadas para a sala.');
      }
    }
    addEventListener('delta-rpg:save',event=>{
      if(applying||!sharedId||event.detail?.fileId!==sharedId)return;
      clearTimeout(sending);
      sending=setTimeout(flush,230);
    });

    function receive(data,isFirst){
      if(!data||typeof data!=='object'||Array.isArray(data))return false;
      try{
        if(JSON.stringify(data.character).length>220000)return false;
        applying=true;
        if(isFirst){
          sharedId=bridge.createSharedFile(data.character,data.label);
          return Boolean(sharedId);
        }
        return Boolean(bridge.writeRemoteFile(sharedId,data.character));
      }catch(err){
        console.warn('Arquivo da sessão rejeitado:',err);
        return false;
      }finally{applying=false}
    }

    function acceptGuest(c){
      if(clients.size>=5){
        c.on('open',()=>{send(c,{kind:'full'});c.close()});
        return;
      }
      clients.add(c);
      c.on('open',()=>{
        send(c,packageState());
        refresh();
        report('SALA ATIVA · '+clients.size+' participante(s) conectados.');
      });
      c.on('data',data=>{
        if(!c.open||!data||data.kind!=='edit'||!data.character)return;
        if(!receive(data,false))return;
        revision++;
        broadcast();
        report('SALA ATIVA · alteração de participante sincronizada.');
      });
      c.on('close',()=>{
        clients.delete(c);
        if(mode==='host'){
          refresh();report('SALA ATIVA · '+clients.size+' participante(s) conectados.');
        }
      });
      c.on('error',err=>console.warn('Conexão com participante:',err));
      refresh();
    }
    function connectToHost(c){
      hostConn=c;
      c.on('open',()=>report('Conectado · recebendo ficha compartilhada...'));
      c.on('data',data=>{
        if(!data||typeof data!=='object')return;
        if(data.kind==='full'){
          stop('A sala chegou ao limite de participantes.');return;
        }
        if(data.kind!=='state'||!Number.isInteger(data.revision)||
          data.revision<lastRevision||!data.character)return;
        if(!receive(data,sharedId===null)){
          stop('Não foi possível receber a ficha (verifique o limite de FILES).');return;
        }
        lastRevision=data.revision;
        connected=true;refresh();
        report('SINCRONIZADO ✓ · alterações enviadas nos dois sentidos.');
      });
      c.on('close',()=>{
        if(mode==='guest')stop('A sala desconectou. Seu FILE local foi preservado.');
      });
      c.on('error',err=>console.warn('Conexão com anfitrião:',err));
    }

    let peerLibrary=null;
    function loadPeerJS(){
      if(typeof window.Peer==='function')return Promise.resolve(window.Peer);
      if(peerLibrary)return peerLibrary;
      peerLibrary=new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
        script.async=true;
        script.onload=()=>typeof window.Peer==='function'?
          resolve(window.Peer):reject(new Error('Biblioteca P2P indisponível'));
        script.onerror=()=>reject(new Error('Falha ao baixar PeerJS'));
        document.head.appendChild(script);
      }).catch(err=>{peerLibrary=null;throw err});
      return peerLibrary;
    }
    function generateCode(){
      const bytes=new Uint8Array(10);
      crypto.getRandomValues(bytes);
      return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    }

    async function createRoom(){
      if(mode!=='offline')return;
      const id=bridge.activeFileId();
      if(!bridge.readFile(id)){
        report('Abra um FILE válido antes de criar uma sala.');return;
      }
      const current=++serial;
      report('Iniciando sala...');
      try{
        const Peer=await loadPeerJS();
        if(current!==serial||mode!=='offline')return;
        mode='host';sharedId=id;room=generateCode();revision=1;
        peer=new Peer('delta-rpg-'+room.toLowerCase());
        peer.on('open',()=>{
          $('deltaLiveRoom').textContent=room;
          refresh();
          report('SALA ATIVA · compartilhe o código com alguém para editar junto.');
        });
        peer.on('connection',acceptGuest);
        peer.on('error',err=>{
          const code=err.type||'desconhecido';
          if(['unavailable-id','network','server-error','socket-error','disconnected'].includes(code))
            stop('Não foi possível criar a sala ('+code+').');
          else report('Erro na sala: '+code+'.');
        });
        refresh();report('Conectando ao serviço de sessões...');
      }catch(err){stop('Erro ao iniciar sala: '+err.message);}
    }
    async function joinRoom(){
      if(mode!=='offline')return;
      const code=input.value.trim().replace(/[\s-]/g,'').toUpperCase();
      if(!/^[0-9A-F]{20}$/.test(code)){
        report('Digite o código de 20 caracteres fornecido pelo anfitrião.');
        return;
      }
      const current=++serial;report('Buscando sala...');
      try{
        const Peer=await loadPeerJS();
        if(current!==serial||mode!=='offline')return;
        mode='guest';room=code;sharedId=null;lastRevision=-1;
        peer=new Peer();
        peer.on('open',()=>{
          const c=peer.connect('delta-rpg-'+room.toLowerCase(),{
            serialization:'json',reliable:true
          });
          connectToHost(c);
          report('Conectando ao anfitrião...');
        });
        peer.on('error',err=>{
          const code=err.type||'desconhecido';
          if(['peer-unavailable','network','server-error','socket-error','disconnected'].includes(code))
            stop('Não foi possível conectar ('+code+'). Confira o código.');
          else report('Erro ao entrar na sala: '+code+'.');
        });
        refresh();
      }catch(err){stop('Erro ao entrar: '+err.message);}
    }

    btn.addEventListener('click',()=>dialog.showModal());
    $('deltaLiveClose').addEventListener('click',()=>dialog.close());
    hostBtn.addEventListener('click',createRoom);
    joinBtn.addEventListener('click',joinRoom);
    stopBtn.addEventListener('click',()=>{
      serial++;stop('Desconectado. Seu FILE continua salvo no navegador.');
    });
    $('deltaLiveCopy').addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(room);
        report('Código copiado. Compartilhe apenas com quem pode editar a ficha.');
      }catch(_){report('Copie o código de sala exibido acima.');}
    });
    input.addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom();});
    window.addEventListener('beforeunload',()=>{if(peer)peer.destroy();});
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();