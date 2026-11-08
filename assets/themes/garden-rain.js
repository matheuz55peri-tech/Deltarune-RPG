/* DELTA RPG | Jardim Azul: chuva no vidro + ondinhas pixelart.
   Efeito visual global sobre menus, sem interceptar cliques. */
(() => {
  'use strict';

  function init() {
    if (document.getElementById('delta-garden-rain')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'delta-garden-rain';
    canvas.className = 'delta-garden-rain';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const style = document.createElement('style');
    style.textContent = [
      '#delta-garden-rain{position:fixed;inset:0;width:100%;height:100%;',
      'z-index:2147483646;pointer-events:none!important;user-select:none;',
      'image-rendering:pixelated;opacity:.78;display:none;contain:strict}',
      'html[data-theme="garden"] #delta-garden-rain{display:block}'
    ].join('');
    document.head.append(style);
    document.body.append(canvas);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const drops = [];
    const ripples = [];
    let w = 1, h = 1, active = false, raf = 0, last = 0;
    const rand = (min, max) => min + Math.random() * (max - min);
    const isGarden = () => document.documentElement.dataset.theme === 'garden';
    const bounded = (v,lo,hi) => Math.max(lo,Math.min(v,hi));

    function drop(initial = false) {
      const near = Math.random() < .30;
      const y = initial ? rand(-h*.2, h) : rand(-h*.33-15,-6);
      const hit = rand(h*.14, h*.97); // As gotas atingem o "vidro" em qualquer altura.
      return {
        x: rand(3,w+12), y,
        hit: initial ? Math.max(hit, y + rand(5,h*.22)) : hit,
        near, alpha: near ? rand(.25,.48) : rand(.09,.23),
        speed: near ? rand(82,130) : rand(48,85),
        length: near ? rand(6,11)|0 : rand(3,7)|0,
        drift: rand(-3.4,-.6)
      };
    }

    function makeRipple(x,y,force = 1,clicked = false) {
      if (ripples.length >= 56) ripples.shift();
      ripples.push({
        x: bounded(x,1,w-1),y:bounded(y,1,h-1),
        age:0, duration: clicked ? .83 : rand(.48,.8),
        max:clicked ? 19 : rand(7,12)*force,
        bright:clicked ? .72 : rand(.25,.48),
        clicked
      });
    }

    function resize() {
      w = Math.max(1,Math.ceil(innerWidth/3));
      h = Math.max(1,Math.ceil(innerHeight/3));
      canvas.width=w;canvas.height=h;
      ctx.imageSmoothingEnabled=false;
      const count=bounded(Math.round(w*h/1800),38,155);
      drops.length=0; ripples.length=0;
      for(let i=0;i<count;i++)drops.push(drop(true));
      if(!reduced.matches)draw(0);
    }

    // Círculos formados por pequenos quadrados, sem blur nem linhas suaves.
    function dottedOval(x,y,rx,ry,alpha,color) {
      if(rx < 1) return;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=color;
      const samples=Math.max(16,Math.ceil(rx*5));
      for(let j=0;j<samples;j++){
        const a=j/samples*Math.PI*2;
        // Pequenas falhas entre pixels imitam reflexos na água.
        if((j%17===13)&&(rx>9))continue;
        const px=Math.round(x+Math.cos(a)*rx);
        const py=Math.round(y+Math.sin(a)*ry);
        ctx.fillRect(px,py,rx>12&&j%7===0?2:1,1);
      }
    }

    function draw(dt) {
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<drops.length;i++){
        let d=drops[i];
        if(dt){
          d.y+=d.speed*dt;
          d.x+=d.drift*dt;
          if(d.y>=d.hit || d.x<0){
            if(d.x>0 && d.x<w && d.y>=d.hit && Math.random()<.92){
              makeRipple(d.x,d.hit,d.near?1.1:.85);
            }
            d=drops[i]=drop();
          }
        }
        const x=Math.round(d.x),y=Math.round(d.y);
        // A cauda translúcida e a ponta luminosa dão profundidade à chuva.
        ctx.fillStyle=d.near?'#8fddec':'#6ca9c3';
        ctx.globalAlpha=d.alpha*.34;
        ctx.fillRect(x,y,1,d.length);
        ctx.globalAlpha=d.alpha;
        ctx.fillRect(x,y+Math.floor(d.length*.45),1,Math.ceil(d.length*.55));
        ctx.globalAlpha=d.alpha*.85;
        ctx.fillStyle='#e0fbff';
        ctx.fillRect(x,y+d.length-1,d.near?2:1,1);
      }

      for(let i=ripples.length-1;i>=0;i--){
        const r=ripples[i];
        if(dt)r.age+=dt;
        if(r.age>=r.duration){ripples.splice(i,1);continue;}
        const p=r.age/r.duration;
        const ease=1-Math.pow(1-p,2);
        const size=1+r.max*ease;
        const fade=Math.pow(1-p,1.25)*r.bright;
        const x=Math.round(r.x), y=Math.round(r.y);
        // Duas ou três ondinhas concêntricas, alongadas como numa poça.
        dottedOval(x,y,size,Math.max(1,size*.42),fade*.85,'#c3faff');
        if(p>.12)dottedOval(x,y,size*.69,Math.max(1,size*.69*.46),
          fade*.36,'#57d6eb');
        if(r.clicked && p>.2)dottedOval(x,y,size*.40,Math.max(1,size*.18),
          fade*.58,'#e1ffff');
        if(p<.22){
          ctx.globalAlpha=fade*.9;
          ctx.fillStyle='#f4ffff';
          ctx.fillRect(x,y,2,1);
          ctx.fillRect(x-1,y-2,1,1);
          // Pequenos respingos sobem antes de a onda se espalhar.
          const jump=Math.round(p*10);
          ctx.globalAlpha=fade*.65;
          ctx.fillRect(x-2-jump,y-1-jump,1,1);
          ctx.fillRect(x+2+jump,y-2-jump,1,1);
        }
      }
      ctx.globalAlpha=1;
    }

    function tick(now) {
      if(!active)return;
      raf=requestAnimationFrame(tick);
      if(last && now-last<30)return; // Pixel-art: ~30 quadros/seg.
      const dt=last?Math.min((now-last)/1000,.055):0;
      last=now;
      draw(dt);
    }

    function sync() {
      const enabled=isGarden()&&!document.hidden&&!reduced.matches;
      if(enabled&&!active){
        active=true;last=0;raf=requestAnimationFrame(tick);
      }else if(!enabled&&active){
        active=false;cancelAnimationFrame(raf);last=0;
      }
      if(reduced.matches){ripples.length=0;ctx.clearRect(0,0,w,h)}
    }

    // Pointerdown é acionado no celular e em botões/menus também.
    document.addEventListener('pointerdown',event=>{
      if(!isGarden()||reduced.matches||event.button>0)return;
      makeRipple(event.clientX/3,event.clientY/3,1.5,true);
      // Primeiro quadro imediato, inclusive se a guia já estava em repouso.
      if(!active)draw(0);
    },{capture:true,passive:true});

    resize();
    new MutationObserver(sync).observe(document.documentElement,{
      attributes:true,attributeFilter:['data-theme']
    });
    addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',sync);
    if(reduced.addEventListener)reduced.addEventListener('change',sync);
    else if(reduced.addListener)reduced.addListener(sync);
    sync();
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();