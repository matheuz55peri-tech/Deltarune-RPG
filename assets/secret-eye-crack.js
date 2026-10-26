/* O Outro Lado — fissuras no vidro e olhos em cascata */
(() => {
 'use strict';
 window.DeltaEyeCrack=(()=>{
  let current=null;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function play(onReveal){
   if(current){current.remove();current=null;}
   if(reduce.matches){onReveal();return;}
   const layer=document.createElement('canvas');
   layer.id='delta-eye-crack';layer.setAttribute('aria-hidden','true');
   const ctx=layer.getContext('2d');
   if(!ctx){onReveal();return;}
   document.body.append(layer);current=layer;
   const dpr=Math.min(2,devicePixelRatio||1);
   const w=innerWidth,h=innerHeight;
   layer.width=Math.ceil(w*dpr);layer.height=Math.ceil(h*dpr);
   ctx.scale(dpr,dpr);
   const cx=w*.5,cy=h*.49;
   let seed=417221;
   const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
   const cracks=[],eyes=[];
   const rays=39;
   const min=Math.min(w,h);
   for(let i=0;i<rays;i++){
    const angle=i/rays*Math.PI*2+(random()-.5)*.15;
    const reach=Math.hypot(w,h)*(.45+random()*.26);
    const bend=(random()-.5)*.43;
    const pts=[{x:cx,y:cy}];
    for(let j=1;j<=7;j++){
     const t=j/7;
     const theta=angle+Math.sin(t*7+bend)*bend*.28+(random()-.5)*.12;
     pts.push({x:cx+Math.cos(theta)*reach*t,
       y:cy+Math.sin(theta)*reach*t});
    }
    cracks.push({pts,delay:random()*.24,speed:.33+random()*.24});
    for(let j=2;j<=6;j++){
      if(random()>.66)continue;
      const p=pts[j],size=min*(.015+random()*.045);
      eyes.push({x:p.x+(random()-.5)*25,y:p.y+(random()-.5)*22,size,
        rotation:(random()-.5)*.8,delay:.17+random()*.48,blink:random()*6});
    }
   }
   // Eyes emerge around the central fissure too.
   for(let i=0;i<24;i++){
    const a=random()*6.283,r=(.1+random()*.4)*min;
    eyes.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,
      size:min*(.012+random()*.037),rotation:(random()-.5)*.9,
      delay:.15+random()*.55,blink:random()*6});
   }
   let started=0,raf=0,revealed=false;
   const duration=1120;
   function paint(now){
     if(!current||current!==layer)return;
     if(!started)started=now;
     const t=Math.min(1,(now-started)/duration);
     ctx.clearRect(0,0,w,h);
     ctx.fillStyle='rgba(2,0,9,'+(Math.min(.84,t*.9))+')';
     ctx.fillRect(0,0,w,h);
     for(const crack of cracks){
       const p=Math.max(0,Math.min(1,(t-crack.delay)/crack.speed));
       if(!p)continue;
       const n=crack.pts.length-1,limit=n*p;
       ctx.beginPath();ctx.moveTo(cx,cy);
       for(let k=1;k<=Math.ceil(limit);k++){
        const a=crack.pts[k-1],b=crack.pts[k],portion=Math.min(1,Math.max(0,limit-(k-1)));
        ctx.lineTo(a.x+(b.x-a.x)*portion,a.y+(b.y-a.y)*portion);
       }
       ctx.lineCap='round';ctx.lineJoin='bevel';
       ctx.strokeStyle='rgba(182,30,69,'+(0.3+.42*p)+')';
       ctx.lineWidth=7;ctx.stroke();
       ctx.strokeStyle='rgba(243,214,194,'+(.55+.4*p)+')';
       ctx.lineWidth=1.35;ctx.stroke();
     }
     for(const eye of eyes){
       const p=Math.max(0,Math.min(1,(t-eye.delay)*6));
       if(!p)continue;
       const radius=eye.size*(.2+.8*p);
       const blink=Math.abs(Math.sin((t*7)+eye.blink))*.11;
       ctx.save();ctx.translate(eye.x,eye.y);ctx.rotate(eye.rotation);
       ctx.shadowBlur=17;ctx.shadowColor='#dcd1c5';
       ctx.fillStyle='rgba(238,223,197,'+(.45+.55*p)+')';
       ctx.beginPath();ctx.ellipse(0,0,radius,radius*(.41-blink),0,0,Math.PI*2);ctx.fill();
       ctx.shadowBlur=0;
       ctx.fillStyle='#030206';ctx.beginPath();ctx.ellipse(0,0,radius*.38,radius*.37,0,0,Math.PI*2);ctx.fill();
       ctx.strokeStyle='rgba(255,252,228,.9)';ctx.lineWidth=1;
       ctx.beginPath();ctx.ellipse(0,0,radius*.48,radius*.4,0,0,Math.PI*2);ctx.stroke();
       ctx.restore();
     }
     const aperture=Math.max(0,(t-.62)/.38);
     if(aperture>0){
       ctx.fillStyle='rgba(0,0,0,'+Math.min(1,aperture*1.4)+')';
       ctx.beginPath();ctx.ellipse(cx,cy,min*aperture*1.1,min*aperture*.8,0,0,Math.PI*2);ctx.fill();
     }
     if(t>.72&&!revealed){revealed=true;onReveal();}
     if(t<1)raf=requestAnimationFrame(paint);
     else setTimeout(()=>{if(current===layer){layer.remove();current=null;}},150);
   }
   raf=requestAnimationFrame(paint);
   return ()=>{cancelAnimationFrame(raf);if(current===layer){layer.remove();current=null;}};
  }
  return {play};
 })();
})();