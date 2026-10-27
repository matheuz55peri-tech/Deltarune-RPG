(function(){
'use strict';
const INBOX='codex-delta-inbox-v1';
const validStats=['strength','defense','intelligence','agility'];
const $delta=id=>document.getElementById(id);
let lastSignature=null;
function accept(data){
 if(!data||data.format!=='codex-item-v1'||!data.item||typeof data.item.name!=='string')throw Error('Este não é um item Codex válido.');
 const m=data.item,name=m.name.trim().slice(0,55);
 if(!name)throw Error('Nome do item vazio.');
 const bonuses=(Array.isArray(m.bonuses)?m.bonuses:[]).filter(x=>x&&validStats.includes(x.stat)&&Number(x.value)>0).slice(0,8).map(x=>({stat:x.stat,value:Math.min(999,Math.trunc(Number(x.value)))}));
 const kind=['⚔','✦','♥','⬡','◆','✿'].includes(m.type)?m.type:'◆';
 const desc=[m.description||'',m.effect?'Efeito: '+m.effect:'',m.tags?'Etiquetas: '+m.tags:'',m.rarity?'Raridade: '+m.rarity:''].filter(Boolean).join('\n').slice(0,3000);
 const img=typeof data.card==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.card)&&data.card.length<=350000?data.card:null;
 const record={id:makeId(),name,description:desc,type:kind,
    quantity:Math.max(1,Math.min(9999,Math.trunc(Number(m.quantity)||1))),
    equipmentData:normalizeGearSnapshot({weight:Math.max(0,Number(m.weight)||0),damageDice:String(m.damageDice||'').slice(0,40),isDamage:kind==='⚔'||Boolean(m.damageDice),bonuses})};
 if(img)record.codexImage=img;
 state.items.push(record);state.selectedItem=record.id;renderLibrary('inventory');persist();switchTab('inventory');toast('✦ Item recebido do Codex Arcano: '+name);return record;
}
function receiveInbox(){try{
 const raw=localStorage.getItem(INBOX);if(!raw)return;
 const data=JSON.parse(raw);
 accept(data);
 localStorage.removeItem(INBOX);
 if(location.hash==='#codex-import')history.replaceState(null,'',location.pathname);
}catch(err){console.error('Codex import error',err);toast('Erro ao importar Codex: '+err.message)}}
const btn=document.createElement('button');btn.type='button';btn.className='library-btn';btn.textContent='⇧ IMPORTAR DO CODEX';
const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
btn.onclick=()=>file.click();file.onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{accept(JSON.parse(await f.text()))}catch(err){toast('Importação falhou: '+err.message)}finally{e.target.value=''}};
const area=$delta('addItemBtn')?.parentElement;if(area){area.append(btn,file)}
const style=document.createElement('style');style.textContent='.codex-art-panel{display:grid;place-items:center;max-height:280px;min-height:150px;border:1px solid rgba(224,190,255,.35);border-radius:12px;margin:12px 0;padding:14px;background:radial-gradient(circle at center,#302645,#151221)}.codex-art-panel img{width:100%;max-height:240px;object-fit:contain;image-rendering:pixelated}.codex-art-download{margin-bottom:8px;display:inline-flex;padding:9px 12px;border-radius:8px;color:#e4cfff;border:1px solid #8c6ea0;background:#24192f;cursor:pointer}';document.head.append(style);
const detail=$delta('itemDetail');
function addArt(){if(!detail||detail.querySelector('.codex-art-panel'))return;const it=state.items.find(x=>x.id===state.selectedItem);if(!it?.codexImage)return;const panel=document.createElement('div');panel.className='codex-art-panel';const img=document.createElement('img');img.src=it.codexImage;img.alt='Imagem de '+it.name;panel.append(img);
const download=document.createElement('button');download.type='button';download.className='codex-art-download';download.textContent='⇩ PNG do item';download.onclick=()=>{const a=document.createElement('a');a.href=it.codexImage;a.download=it.name.replace(/[^a-zA-Z0-9_-]+/g,'_')+'.png';a.click()};
const desc=detail.querySelector('.detail-description');if(desc)desc.before(panel);else detail.append(panel);panel.after(download)}
if(detail){new MutationObserver(()=>addArt()).observe(detail,{childList:true,subtree:false});addArt()}
window.addEventListener('storage',e=>{if(e.key===INBOX)receiveInbox()});
window.addEventListener('focus',receiveInbox);
receiveInbox();
})();