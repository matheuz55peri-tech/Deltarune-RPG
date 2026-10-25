/* DELTA RPG • ficha A4 para o mestre. Mantém o site intacto. */
(function(){
  'use strict';
  const C={
    paper:[9,15,30],panel:[19,29,50],panel2:[24,38,62],
    line:[57,76,105],white:[245,248,255],muted:[162,181,208],
    heal:[86,226,160],damage:[255,105,129],buff:[182,135,255],
    tp:[100,207,245],gold:[249,207,132]
  };
  const W=210,H=297,M=12,INNER=W-2*M;
  const clean=(v)=>String(v??'').replace(/[\u{1F300}-\u{1FAFF}]/gu,'').replace(/[^\x20-\x7e\u00C0-\u00FF\n]/g,' ').trim();
  const num=(v)=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const rgb=(s)=>{
    const m=String(s||'').match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if(m)return [1,2,3].map(i=>Math.max(0,Math.min(255,Math.round(+m[i]))));
    const h=String(s||'').match(/hsla?\(([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
    if(h){
      const hue=(+h[1]%360)/60,ss=+h[2]/100,ll=+h[3]/100;
      const chroma=(1-Math.abs(2*ll-1))*ss, xx=chroma*(1-Math.abs(hue%2-1)),mm=ll-chroma/2;
      const k=[[chroma,xx,0],[xx,chroma,0],[0,chroma,xx],[0,xx,chroma],[xx,0,chroma],[chroma,0,xx]][Math.floor(hue)%6];
      return k.map(x=>Math.round((x+mm)*255));
    }
    const hex=String(s||'').match(/^#([a-f0-9]{6})$/i);
    return hex?[0,2,4].map(p=>parseInt(hex[1].slice(p,p+2),16)):[116,217,250];
  };
  const filename=(name)=>((clean(name)||'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,45)||'personagem')+'_DELTA_RPG.pdf';
  window.DeltaCompactPDF=async function(data){
    if(!window.jspdf?.jsPDF)throw new Error('Biblioteca jsPDF indisponível');
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    pdf.setProperties({title:'Ficha RPG - '+clean(data.name||'Personagem'),subject:'Resumo para o mestre',creator:'DELTA RPG'});
    let y=12, page=0;
    const accent=rgb(data.color);
    const bg=(arr)=>pdf.setFillColor(...arr);
    const ink=(arr)=>pdf.setTextColor(...arr);
    const stroke=(arr)=>pdf.setDrawColor(...arr);
    const text=(str,x,yy,size=9,color=C.white,bold=false)=>{
      ink(color);pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);
      pdf.text(clean(str),x,yy);
    };
    function basePage(continued=false){
      if(page++)pdf.addPage('a4','portrait');
      bg(C.paper);pdf.rect(0,0,W,H,'F');
      bg(accent);pdf.rect(0,0,W,2.1,'F');
      bg(C.panel);pdf.roundedRect(M,10,INNER,continued?18:35,3,3,'F');
      if(continued){
        text('DELTA // RPG',M+7,21,12,C.white,true);
        text('FICHA DE '+clean(data.name||'PERSONAGEM').toUpperCase().slice(0,36),W-M-87,21,8,C.muted,true);
        y=34;return;
      }
      const shape=['0110110','1111111','1111111','0111110','0011100','0001000'];
      const pix=2.3,x0=M+7,y0=17;
      for(let row=0;row<shape.length;row++)for(let col=0;col<7;col++){
        if(shape[row][col]==='1'){bg(accent);pdf.rect(x0+col*pix,y0+row*pix,pix-.17,pix-.17,'F')}
      }
      text('DELTA // RPG',M+28,20.5,16,C.white,true);
      text('ARQUIVO DE PERSONAGENS  /  FICHA DO MESTRE',M+28,27,7.5,C.muted,true);
      text(clean(data.name||'PERSONAGEM SEM NOME').toUpperCase().slice(0,45),M+28,38,13,C.white,true);
      bg(C.panel2);pdf.roundedRect(W-M-28,17,21,17,2,2,'F');
      text('NÍVEL',W-M-25,23,7,C.muted,true);
      text(String(data.level||1),W-M-25,31,12,C.white,true);
      y=50;
    }
    const ensure=(height)=>{if(y+height>H-15)basePage(true)};
    const section=(label,color=accent)=>{
      ensure(14);bg(color);pdf.roundedRect(M,y,3,8,1,1,'F');
      text(label.toUpperCase(),M+7,y+6,9.5,C.white,true);
      y+=12;
    };
    const panel=(x,top,w,h)=>{bg(C.panel);pdf.roundedRect(x,top,w,h,2.7,2.7,'F');stroke(C.line);pdf.setLineWidth(.2);pdf.roundedRect(x,top,w,h,2.7,2.7,'S')};
    const small=(s,w,size=8.3)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);return pdf.splitTextToSize(clean(s),w)};
    const line=(x,yy,w,col=C.line)=>{stroke(col);pdf.setLineWidth(.24);pdf.line(x,yy,x+w,yy)};
    basePage();
    section('Identidade e atributos');
    const stats=data.stats||[];
    const gap=3,statW=(INNER-gap*3)/4;
    stats.forEach((s,i)=>{
      const x=M+i*(statW+gap);
      panel(x,y,statW,24);
      text(clean(s.label||s.key||'ATRIBUTO').toUpperCase(),x+4,y+7.5,7.7,C.muted,true);
      text(num(s.base),x+4,y+18.5,16,C.white,true);
      if(Number(s.bonus)>0)text('+'+num(s.bonus),x+23,y+18.5,9,C.buff,true);
    });
    y+=28;
    ensure(30);
    panel(M,y,(INNER-3)/2,28);
    panel(M+(INNER+3)/2,y,(INNER-3)/2,28);
    const vitals=[
      {x:M,title:'HP / VIDA',value:num(data.hp)+' / '+num(data.maxHp),pct:data.maxHp?data.hp/data.maxHp:0,color:C.damage,sub:(Number(data.shield)>0?'+ '+num(data.shield)+' HP temporário':'Vida máxima baseada em Defesa')},
      {x:M+(INNER+3)/2,title:'TP / ENERGIA',value:num(data.tp)+' / 100',pct:Number(data.tp)/100,color:C.tp,sub:'+'+num(data.gain)+' TP por ação'}
    ];
    for(const v of vitals){
      text(v.title,v.x+4,y+7,8,C.muted,true);text(v.value,v.x+4,y+14.4,11.4,C.white,true);
      bg(C.line);pdf.roundedRect(v.x+4,y+17,(INNER-3)/2-8,2.6,1,1,'F');
      const filled=Math.max(0,Math.min(1,v.pct))*((INNER-3)/2-8);if(filled>0){bg(v.color);pdf.roundedRect(v.x+4,y+17,filled,2.6,1,1,'F')}
      text(v.sub,v.x+4,y+25.1,7,C.muted,false);
    }
    y+=32;
    if(data.buffs?.length){
      section('Efeitos ativos',C.buff);
      const rows=data.buffs.map(b=>clean(b.name)+'  /  +'+num(b.amount)+' '+clean(b.target)+'  /  '+num(b.remaining)+' turnos');
      for(const r of rows){
        const lines=small(r,INNER-12,8);
        const h=5+lines.length*3.5;ensure(h);
        panel(M,y,INNER,h);lines.forEach((l,i)=>text(l,M+4,y+5+i*3.5,8,C.white));y+=h+2;
      }
      y+=2;
    }
    section('Habilidades',C.gold);
    const groups=[
      ['DANO','damage',C.damage],
      ['CURA','heal',C.heal],
      ['BUFF','buff',C.buff]
    ];
    let hasSkills=false;
    for(const [label,kind,catColor] of groups){
      const entries=(data.skills||[]).filter(s=>(s.category||'damage')===kind);
      if(!entries.length)continue;
      hasSkills=true;ensure(14);
      text(label+'  /  '+entries.length+' HABILIDADE'+(entries.length===1?'':'S'),M+2,y+5,8,catColor,true);y+=9;
      const colGap=3,colW=(INNER-colGap)/2;
      for(let i=0;i<entries.length;i+=2){
        const pair=entries.slice(i,i+2);
        const layouts=pair.map(e=>{
          const d=small(e.description||'Sem descrição',colW-9,7.8);
          const details=kind==='buff'?'+'+num(e.amount||0)+' '+clean(e.target||'atributo')+'  /  '+num(e.turns||0)+' turnos':
            kind==='heal'?'Cura '+num(e.power||0)+' HP':'Dano '+num(e.power||0);
          return {entry:e,desc:d,details,height:Math.max(22,16+d.length*3.4)};
        });
        const rowH=Math.max(...layouts.map(a=>a.height));
        if(rowH>236){throw new Error('Descrição de habilidade muito longa para caber em um único cartão do PDF.')}
        ensure(rowH+3);
        layouts.forEach((v,j)=>{
          const x=M+j*(colW+colGap);panel(x,y,colW,rowH);
          bg(catColor);pdf.rect(x,y,1.65,rowH,'F');
          const nm=small(v.entry.name||'SEM NOME',colW-28,9)[0]||'SEM NOME';
          text(nm,x+4,y+6.2,9,C.white,true);
          text(num(v.entry.cost||0)+'% TP',x+colW-23,y+6.2,8,catColor,true);
          text(v.details,x+4,y+11.5,7.4,catColor);
          v.desc.forEach((ln,k)=>text(ln,x+4,y+16.1+k*3.4,7.8,C.muted));
        });
        y+=rowH+3;
      }
      y+=2;
    }
    if(!hasSkills){panel(M,y,INNER,12);text('Nenhuma habilidade cadastrada.',M+5,y+7.4,8,C.muted);y+=16}
    y+=3;
    section('Inventário',C.tp);
    const items=data.items||[];
    if(!items.length){panel(M,y,INNER,12);text('Nenhum item cadastrado.',M+5,y+7.4,8,C.muted);y+=16}
    else{
      const colGap=3,colW=(INNER-colGap)/2;
      for(let i=0;i<items.length;i+=2){
        const layouts=items.slice(i,i+2).map(item=>{
          const desc=small(item.description||'',colW-9,7.7);
          return {item,desc,h:Math.max(14,10+desc.length*3.4)};
        });
        const rowH=Math.max(...layouts.map(a=>a.h));
        if(rowH>236)throw new Error('Descrição de item muito longa para caber em um único cartão do PDF.');
        ensure(rowH+3);
        layouts.forEach((v,j)=>{
          const x=M+j*(colW+colGap);panel(x,y,colW,rowH);
          text(small(v.item.name||'ITEM',colW-24,9)[0]||'ITEM',x+4,y+6.2,8.8,C.white,true);
          text('x'+num(v.item.quantity||1),x+colW-15,y+6.2,8,C.tp,true);
          v.desc.forEach((ln,k)=>text(ln,x+4,y+11+k*3.4,7.6,C.muted));
        });
        y+=rowH+3;
      }
    }
    const count=pdf.getNumberOfPages();
    for(let p=1;p<=count;p++){
      pdf.setPage(p);line(M,H-11,INNER);
      text('DELTA RPG  •  FICHA PARA CONSULTA DO MESTRE',M,H-6.8,7,C.muted);
      text(String(p)+' / '+String(count),W-M-15,H-6.8,7,C.muted,true);
    }
    pdf.save(filename(data.name));
    return count;
  };
})();