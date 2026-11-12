/* DELTA RPG · transporta mensagens P2P grandes em fragmentos confiáveis. */
(()=>{
'use strict';
const MAX_PACKET_SIZE=6*1024*1024;
const CHUNK_SIZE=16*1024;
const MAX_CHUNKS=Math.ceil(MAX_PACKET_SIZE/CHUNK_SIZE);
const MAX_PENDING=4;
const ASSEMBLY_TIMEOUT=30000;
const assemblies=new WeakMap();
const FRAGMENT_KIND='__delta_rpg_fragment_v1';
function serialize(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 try{
  const json=JSON.stringify(value);
  return typeof json==='string'&&json.length<=MAX_PACKET_SIZE?json:null;
 }catch(_){return null}
}
function valid(value){return serialize(value)!==null}
function send(connection,value){
 if(!connection?.open||!value||typeof value!=='object'||Array.isArray(value))return false;
 const json=serialize(value);if(!json)return false;
 try{
  if(json.length<=CHUNK_SIZE){connection.send(value);return true}
  const total=Math.ceil(json.length/CHUNK_SIZE);
  const bytes=crypto.getRandomValues(new Uint8Array(8));
  const id=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
  for(let index=0;index<total;index++){
   connection.send({kind:FRAGMENT_KIND,id,index,total,payload:json.slice(index*CHUNK_SIZE,(index+1)*CHUNK_SIZE)});
  }
  return true;
 }catch(error){console.warn('Falha ao enviar dados da sala ao vivo',error);return false}
}
function receive(connection,message){
 if(!message||message.kind!==FRAGMENT_KIND)return message;
 if(!connection||!connection.open||!/^[a-f0-9]{16}$/.test(message.id||'')||
   !Number.isInteger(message.total)||message.total<2||message.total>MAX_CHUNKS||
   !Number.isInteger(message.index)||message.index<0||message.index>=message.total||
   typeof message.payload!=='string'||message.payload.length>CHUNK_SIZE)return null;
 let pending=assemblies.get(connection);
 if(!pending){pending=new Map();assemblies.set(connection,pending)}
 let entry=pending.get(message.id);
 if(!entry){
  if(pending.size>=MAX_PENDING)return null;
  entry={total:message.total,chunks:new Array(message.total),received:0,size:0,timer:0};
  entry.timer=setTimeout(()=>pending.delete(message.id),ASSEMBLY_TIMEOUT);
  pending.set(message.id,entry);
 }else if(entry.total!==message.total){
  clearTimeout(entry.timer);pending.delete(message.id);return null;
 }
 if(entry.chunks[message.index]!==undefined){
  if(entry.chunks[message.index]!==message.payload){
   clearTimeout(entry.timer);pending.delete(message.id);
  }
  return null;
 }
 entry.chunks[message.index]=message.payload;
 entry.received++;entry.size+=message.payload.length;
 if(entry.size>MAX_PACKET_SIZE){
  clearTimeout(entry.timer);pending.delete(message.id);return null;
 }
 if(entry.received!==entry.total)return null;
 clearTimeout(entry.timer);pending.delete(message.id);
 try{
  const result=JSON.parse(entry.chunks.join(''));
  return valid(result)&&result?.kind!==FRAGMENT_KIND?result:null;
 }catch(_){return null}
}
window.DeltaRpgLivePackets=Object.freeze({
 maxPacketSize:MAX_PACKET_SIZE,
 valid,
 send,
 receive
});
})();
