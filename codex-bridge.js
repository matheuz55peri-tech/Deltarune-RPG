(function(){
'use strict';
// Pontes de itens: fundo GIF + arte do item + moldura externa são camadas independentes.
const INBOX='codex-delta-inbox-v1',VISUAL_KEY='delta-codex-layered-icons-v2',HOST='https://matheuz55peri-tech.github.io/Index-de-itens/';
const validStats=['strength','defense','intelligence','agility'];
const $delta=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
let visuals={};try{const stored=JSON.parse(localStorage.getItem(VISUAL_KEY)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))visuals=stored}catch(_){}
function dataImage(v,max=350000){return typeof v==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<=max?v:null}
function approvedURL(src,kind){
 if(typeof src!=='string')return null;
 try{const u=new URL(src,HOST);if(u.origin!==new URL(HOST).origin)return null;
  if(kind==='frame'&&!/^\/Index-de-itens\/assets\/frames\/frame-0[1-9]\.png$/.test(u.pathname))return null;
  if(kind==='background'&&!/^\/Index-de-itens\/assets\/backgrounds\/background-(0[1-9]|10)\.(jpg|gif)$/.test(u.pathname))return null;
  return u.href
 }catch(_){return null}
}
function visualFrom(data){
 const m=data.item||{},c=data.composition||{},f=clamp(Math.trunc(m.frame),0,9),b=clamp(Math.trunc(m.background),0,10),ext=b>=3&&b<=6?'gif':'jpg';
 return{
  frameUrl:approvedURL(c.frameUrl||(f?'assets/frames/frame-'+String(f).padStart(2,'0')+'.png':null),'frame'),
  backgroundUrl:approvedURL(c.backgroundUrl||(b?'assets/backgrounds/background-'+String(b).padStart(2,'0')+'.'+ext:null),'background'),
  bgZoom:clamp(c.bgZoom??m.bgZoom??100,100,200),bgDim:clamp(c.bgDim??m.bgDim??0,0,75),
  bgX:clamp(c.bgX??m.bgX??0,-256,256),bgY:clamp(c.bgY??m.bgY??0,-256,256),frameScale:clamp(c.frameScale??m.frameScale??100,40,180),frameX:clamp(c.frameX??m.frameX??0,-256,256),frameY:clamp(c.frameY??m.frameY??0,-256,256),pixelArt:(c.pixelArt??m.pixelArt)!==false,
  customFrame:dataImage(data.frameImage,1300000)
 }
}
function saveVisuals(){try{localStorage.setItem(VISUAL_KEY,JSON.stringify(visuals))}catch(e){for(const v of Object.values(visuals))delete v.customFrame;try{localStorage.setItem(VISUAL_KEY,JSON.stringify(visuals))}catch(_){console.warn('Armazenamento de molduras cheio',e)}}}
function accept(data){
 if(!data||data.format!=='codex-item-v1'||!data.item||typeof data.item.name!=='string')throw Error('Este não é um item Codex válido.');
 const m=data.item,name=m.name.trim().slice(0,55);if(!name)throw Error('Nome do item vazio.');
 const bonuses=(Array.isArray(m.bonuses)?m.bonuses:[]).filter(x=>x&&validStats.includes(x.stat)&&Number(x.value)>0).slice(0,8).map(x=>({stat:x.stat,value:Math.min(999,Math.trunc(Number(x.value)))}));
 const kind=['⚔','✦','♥','⬡','◆','✿'].includes(m.type)?m.type:'◆';
 const desc=[m.description||'',m.effect?'Efeito: '+m.effect:'',m.tags?'Etiquetas: '+m.tags:'',m.rarity?'Raridade: '+m.rarity:''].filter(Boolean).join('\n').slice(0,3000);
 const art=dataImage(data.image),fallback=dataImage(data.card);
 const record={id:makeId(),name,description:desc,type:kind,quantity:Math.max(1,Math.min(9999,Math.trunc(Number(m.quantity)||1))),
  equipmentData:normalizeGearSnapshot({weight:Math.max(0,Number(m.weight)||0),damageDice:String(m.damageDice||'').slice(0,40),isDamage:kind==='⚔'||Boolean(m.damageDice),bonuses})};
 if(art||fallback)record.codexImage=art||fallback;
 // O ícone só recebe fundo e moldura separados quando a arte independente está presente.
 if(art){visuals[record.id]=visualFrom(data);saveVisuals()}
 state.items.push(record);state.selectedItem=record.id;
 renderLibrary('inventory');persist();switchTab('inventory');toast('✦ Item recebido do Codex Arcano: '+name);
 return record
}
function receiveInbox(){try{const raw=localStorage.getItem(INBOX);if(!raw)return;const data=JSON.parse(raw);accept(data);localStorage.removeItem(INBOX);if(location.hash==='#codex-import')history.replaceState(null,'',location.pathname)}catch(err){console.error('Codex import error',err);toast('Erro ao importar Codex: '+err.message)}}
const btn=document.createElement('button');btn.type='button';btn.className='library-btn';btn.textContent='⇧ IMPORTAR DO CODEX';
const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
btn.onclick=()=>file.click();file.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{accept(JSON.parse(await f.text()))}catch(err){toast('Importação falhou: '+err.message)}finally{e.target.value=''}};
const area=$delta('addItemBtn')?.parentElement;if(area)area.append(btn,file);
const css=document.createElement('style');
css.textContent='.codex-layered-icon{position:relative;display:block;flex:none;aspect-ratio:1;isolation:isolate;overflow:visible}'
+'.codex-layered-icon .codex-icon-disc{position:absolute;inset:0;clip-path:circle(40% at 50% 50%);background:#251e35;overflow:hidden;z-index:1}'
+'.codex-layered-icon .codex-icon-disc>img{position:absolute;inset:0;width:100%;height:100%;display:block}'
+'.codex-layered-icon .codex-icon-disc>.codex-icon-background{object-fit:cover;image-rendering:auto;transform-origin:center}'
+'.codex-layered-icon .codex-icon-disc>.codex-icon-art{object-fit:fill;image-rendering:pixelated;z-index:3}'
+'.codex-layered-icon .codex-icon-shade{position:absolute;inset:0;z-index:2;pointer-events:none}'
+'.codex-layered-icon>.codex-frame-clip{position:absolute;inset:0;z-index:4;pointer-events:none;-webkit-mask-image:radial-gradient(circle closest-side at center,transparent 0 75%,#000 75.5%);mask-image:radial-gradient(circle closest-side at center,transparent 0 75%,#000 75.5%)}.codex-frame-clip>.codex-icon-frame{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;pointer-events:none;transform-origin:center}'
+'.entry-row.inventory-row .entry-icon.codex-mini-icon{width:52px;height:52px;min-width:52px;line-height:normal;max-width:52px;border-radius:0;font-size:inherit;color:inherit}'
+'.entry-row.inventory-row .entry-icon.codex-mini-icon img{max-width:none}'
+'.codex-art-panel{display:flex;flex-direction:column;align-items:center;gap:9px;padding:17px;border:1px solid rgba(224,190,255,.35);border-radius:12px;margin:12px 0;background:radial-gradient(circle at center,#302645,#151221)}'
+'.codex-art-panel .codex-detail-icon{width:min(100%,260px);max-width:260px;max-height:260px}'
+'.codex-art-panel .codex-art-caption{text-align:center;font-size:11px;letter-spacing:.04em;color:#d6c2e7}'
+'.codex-art-download{margin:0 0 8px;display:inline-flex;padding:9px 12px;border-radius:8px;color:#e4cfff;border:1px solid #8c6ea0;background:#24192f;cursor:pointer}'
+'@media(max-width:500px){.entry-row.inventory-row .entry-icon.codex-mini-icon{width:44px;height:44px;min-width:44px}}';
document.head.append(css);
function buildIcon(it,mini=false){
 const root=document.createElement('span');root.className='codex-layered-icon '+(mini?'entry-icon codex-mini-icon':'codex-detail-icon');root.dataset.codexId=it.id;
 root.setAttribute('role','img');root.setAttribute('aria-label','Ícone circular de '+it.name);
 const c=visuals[it.id]||{};
 const disc=document.createElement('span');disc.className='codex-icon-disc';
 if(c.backgroundUrl){const bg=document.createElement('img');bg.className='codex-icon-background';bg.src=c.backgroundUrl;bg.alt='';bg.loading='lazy';bg.style.transform='translate('+(clamp(c.bgX,-256,256)/512*100)+'%,'+(clamp(c.bgY,-256,256)/512*100)+'%) scale('+(clamp(c.bgZoom,100,200)/100)+')';disc.append(bg)}
 const shade=document.createElement('span');shade.className='codex-icon-shade';shade.style.background='rgba(0,0,0,'+(clamp(c.bgDim,0,75)/100)+')';disc.append(shade);
 const art=document.createElement('img');art.className='codex-icon-art';art.src=it.codexImage;art.alt='';art.loading='lazy';art.style.imageRendering=c.pixelArt===false?'auto':'pixelated';disc.append(art);root.append(disc);
 const frameImg=c.customFrame||c.frameUrl;
 if(frameImg){const wrap=document.createElement('span');wrap.className='codex-frame-clip';const frame=document.createElement('img');frame.className='codex-icon-frame';frame.src=frameImg;frame.alt='';frame.loading='lazy';frame.style.transform='translate('+(clamp(c.frameX,-256,256)/512*100)+'%,'+(clamp(c.frameY,-256,256)/512*100)+'%) scale('+(clamp(c.frameScale,40,180)/100)+')';wrap.append(frame);root.append(wrap)}
 return root
}
const detail=$delta('itemDetail'),inventory=$delta('inventoryList');
function addArt(){
 if(!detail)return;
 const it=state.items.find(x=>x.id===state.selectedItem);
 if(!it?.codexImage)return;
 const existing=detail.querySelector('.codex-art-panel');if(existing?.dataset.codexId===it.id)return;
 existing?.remove();detail.querySelector('.codex-art-download')?.remove();
 const panel=document.createElement('div');panel.className='codex-art-panel';panel.dataset.codexId=it.id;panel.append(buildIcon(it,false));
 const caption=document.createElement('span');caption.className='codex-art-caption';caption.textContent='Ícone circular · fundo interno · moldura externa';panel.append(caption);
 const download=document.createElement('button');download.type='button';download.className='codex-art-download';download.textContent='⇩ Arte do item (PNG)';
 download.onclick=()=>{const a=document.createElement('a');a.href=it.codexImage;a.download=it.name.replace(/[^a-zA-Z0-9_-]+/g,'_')+'_arte.png';a.click()};
 const desc=detail.querySelector('.detail-description');if(desc)desc.before(panel);else detail.append(panel);panel.after(download)
}
function decorateList(){
 if(!inventory)return;
 const lines=inventory.querySelectorAll('.inventory-line'),items=state.items||[];
 for(let i=0;i<lines.length&&i<items.length;i++){
  const it=items[i];if(!it?.codexImage)continue;
  const row=lines[i].querySelector('.entry-row.inventory-row');if(!row)continue;
  const icon=row.querySelector('.entry-icon');if(!icon||icon.dataset.codexId===it.id)continue;
  icon.replaceWith(buildIcon(it,true))
 }
}
if(detail){new MutationObserver(addArt).observe(detail,{childList:true,subtree:false});addArt()}
if(inventory){new MutationObserver(decorateList).observe(inventory,{childList:true,subtree:true});decorateList()}
window.addEventListener('storage',e=>{if(e.key===INBOX)receiveInbox()});
window.addEventListener('focus',receiveInbox);
receiveInbox();
})();