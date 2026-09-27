/* $UNBEAR "Unbearable Wall": client-side confession card generator.
   Everything runs in the browser. Nothing is uploaded or stored.
   Safety: user text is only ever drawn on the canvas (fillText) or set via textContent/URL encoding. Never innerHTML. */
(function(){
  'use strict';
  var d=document,$=function(id){return d.getElementById(id)};
  var W=1200,H=675,MAX=120,MAXH=30;
  var SITE='https://unbear.fun/wall.html';
  var DISPLAY='"Luckiest Guy", Impact, "Arial Black", sans-serif';
  var BODY='"Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  var THEMES={
    neon:{bg:'#0a1f5c',ray:'#0f2b7a',dot:'rgba(57,255,20,.22)',tag:'#39ff14',tagText:'#000',foot:'#000',footText:'#39ff14',footSub:'#9fb3d9',line:'#39ff14'},
    red:{bg:'#ff2e3f',ray:'#ff4f5e',dot:'rgba(0,0,0,.18)',tag:'#ffe600',tagText:'#000',foot:'#000',footText:'#ffe600',footSub:'#ffc9ce',line:'#ffe600'},
    yellow:{bg:'#ffe600',ray:'#ffd400',dot:'rgba(255,46,63,.28)',tag:'#ff2e3f',tagText:'#fff',foot:'#000',footText:'#ffe600',footSub:'#fff4a8',line:'#ff2e3f'},
    bubblegum:{bg:'#ff5fc8',ray:'#ff7fd5',dot:'rgba(88,20,190,.28)',tag:'#39ff14',tagText:'#000',foot:'#1c0640',footText:'#8ff7ff',footSub:'#ffc4ec',line:'#8ff7ff'}
  };

  /* Brand art (same-origin, so the canvas stays exportable) */
  var imgs={bull:new Image(),bear:new Image()},loaded=0;
  imgs.bull.src='assets/bull_sticker.webp';imgs.bear.src='assets/bear_sticker.webp';

  /* ---------- helpers ---------- */
  function clean(s,max){
    s=String(s==null?'':s).replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g,' ').replace(/\s+/g,' ').replace(/^\s+/,'');
    var cp=Array.from(s);
    return cp.length>max?cp.slice(0,max).join(''):s;
  }
  function pad(n){n=String(n);while(n.length<5)n='0'+n;return n}
  function rnd(){
    var a=new Uint32Array(1);
    if(window.crypto&&crypto.getRandomValues){crypto.getRandomValues(a);return 1+a[0]%99999}
    return 1+Math.floor(Math.random()*99999);
  }
  function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function wrap(ctx,text,maxW){
    var words=text.split(' ').filter(Boolean),lines=[],line='';
    words.forEach(function(w){
      while(ctx.measureText(w).width>maxW){
        var ch=Array.from(w),cut=ch.length;
        while(cut>1&&ctx.measureText(ch.slice(0,cut).join('')+'-').width>maxW)cut--;
        if(line){lines.push(line);line=''}
        lines.push(ch.slice(0,cut).join('')+'-');w=ch.slice(cut).join('');
      }
      var t=line?line+' '+w:w;
      if(ctx.measureText(t).width<=maxW)line=t;else{if(line)lines.push(line);line=w}
    });
    if(line)lines.push(line);
    return lines;
  }
  function fitOne(ctx,text,maxW){
    if(ctx.measureText(text).width<=maxW)return text;
    var ch=Array.from(text);
    while(ch.length&&ctx.measureText(ch.join('')+'…').width>maxW)ch.pop();
    return ch.join('')+'…';
  }
  function outlined(ctx,text,x,y,fill,stroke,lw){
    ctx.lineJoin='round';ctx.miterLimit=2;ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.strokeText(text,x,y);
    ctx.fillStyle=fill;ctx.fillText(text,x,y);
  }
  function star(ctx,cx,cy,spikes,ro,ri,rot){
    ctx.beginPath();
    for(var i=0;i<spikes*2;i++){var r=i%2?ri:ro,a=rot+i*Math.PI/spikes;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}
    ctx.closePath();
  }

  /* ---------- the card (always drawn in 1200x675 space) ---------- */
  function drawCard(ctx,o){
    var t=THEMES[o.theme]||THEMES.neon;
    var PX=16,PY=16,PW=W-32,PH=H-32,FOOT=64;
    ctx.save();
    ctx.textAlign='left';ctx.textBaseline='middle';
    /* outer frame */
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    rr(ctx,PX,PY,PW,PH,24);ctx.save();ctx.clip();
    /* panel bg + sunburst */
    ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
    var cx=960,cy=330,n=30;
    ctx.fillStyle=t.ray;
    for(var i=0;i<n;i+=2){var a1=i*2*Math.PI/n,a2=(i+1)*2*Math.PI/n;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a1)*1600,cy+Math.sin(a1)*1600);ctx.lineTo(cx+Math.cos(a2)*1600,cy+Math.sin(a2)*1600);ctx.closePath();ctx.fill()}
    /* halftone dots, bottom-left + top-right */
    ctx.fillStyle=t.dot;
    for(var y=PY;y<H;y+=20){for(var x=PX+((y/20)%2?10:0);x<W;x+=20){
      var dA=Math.hypot(x-PX,y-(PY+PH)),dB=Math.hypot(x-(PX+PW),y-PY),r=Math.max(6.5-dA/80,6.5-dB/70,0);
      if(r>.6){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
    }}
    /* speed lines behind the flying bear */
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineCap='round';
    [[905,300,990,215,9],[930,345,1030,245,7],[880,250,950,180,6],[960,380,1060,290,5],[1000,410,1100,330,6]].forEach(function(l){ctx.lineWidth=l[4];ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke()});
    /* the bull doing the kicking */
    if(imgs.bull.complete&&imgs.bull.naturalWidth){
      var uw=340,uh=uw*imgs.bull.naturalHeight/imgs.bull.naturalWidth;
      ctx.drawImage(imgs.bull,738,236,uw,uh);
    }
    /* BONK burst at the kick */
    ctx.save();ctx.translate(1062,318);
    star(ctx,0,0,12,70,42,-.2);ctx.fillStyle='#000';ctx.save();ctx.translate(5,6);ctx.fill();ctx.restore();
    ctx.fillStyle='#ffe600';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.stroke();
    ctx.rotate(-.2);ctx.textAlign='center';ctx.font='400 31px '+DISPLAY;outlined(ctx,'BONK!',0,4,'#ff2e3f','#000',7);
    ctx.restore();
    /* the bear, flying out of the panel */
    if(imgs.bear.complete&&imgs.bear.naturalWidth){
      var bw=262,bh=bw*imgs.bear.naturalHeight/imgs.bear.naturalWidth;
      ctx.save();ctx.translate(1098,168);ctx.rotate(.42);ctx.drawImage(imgs.bear,-bw/2,-bh/2,bw,bh);ctx.restore();
    }
    /* speech bubble with tail pointing at the bull */
    var bx=46,by=112,bwid=690,bhei=368,br=34,t1=268,t2=338,tipX=842,tipY=292;
    function bubble(){
      ctx.beginPath();ctx.moveTo(bx+br,by);ctx.arcTo(bx+bwid,by,bx+bwid,by+bhei,br);
      ctx.lineTo(bx+bwid,by+t1-by);ctx.lineTo(tipX,tipY);ctx.lineTo(bx+bwid,by+t2-by);
      ctx.arcTo(bx+bwid,by+bhei,bx,by+bhei,br);ctx.arcTo(bx,by+bhei,bx,by,br);ctx.arcTo(bx,by,bx+bwid,by,br);ctx.closePath();
    }
    ctx.save();ctx.translate(10,12);bubble();ctx.fillStyle='#000';ctx.fill();ctx.restore();
    bubble();ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.stroke();
    /* confession text, auto-sized */
    var raw=o.text?o.text:'Type your confession… (e.g. sold my BTC at 16k)';
    var txt=o.text?'“'+raw+'”':raw;
    var tx=bx+40,tw=bwid-80,top=by+30,areaH=bhei-30-66,size=84,lines,lh;
    for(;size>=24;size-=2){ctx.font='400 '+size+'px '+DISPLAY;lines=wrap(ctx,txt,tw);lh=size*1.14;if(lines.length*lh<=areaH)break}
    if(lines.length*lh>areaH){var maxL=Math.max(1,Math.floor(areaH/lh));lines=lines.slice(0,maxL)}
    var y0=top+(areaH-lines.length*lh)/2+lh/2+size*.06;
    ctx.fillStyle=o.text?'#0b0b12':'#9aa3b5';ctx.textAlign='left';
    lines.forEach(function(l,k){ctx.fillText(l,tx,y0+k*lh)});
    /* attribution */
    ctx.font='800 25px '+BODY;ctx.textAlign='right';ctx.fillStyle='#444c5e';
    var who=o.handle?o.handle:'anonymous degen';
    ctx.fillText(fitOne(ctx,'— '+who,tw),bx+bwid-38,by+bhei-38);
    ctx.textAlign='left';
    /* title tag */
    ctx.save();ctx.translate(40,58);ctx.rotate(-.025);
    ctx.font='400 38px '+DISPLAY;
    var title='UNBEARABLE CONFESSION #'+pad(o.num),tl=ctx.measureText(title).width+44;
    ctx.fillStyle='#000';ctx.fillRect(7,-26+7,tl,58);
    ctx.fillStyle=t.tag;ctx.fillRect(0,-26,tl,58);ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.strokeRect(0,-26,tl,58);
    ctx.fillStyle=t.tagText;ctx.fillText(title,22,6);
    ctx.restore();
    /* tagline */
    ctx.font='400 30px '+DISPLAY;
    var tag='THE BEAR MARKET IS UNBEARABLE. SO WE LEFT.',ts=30;
    while(ctx.measureText(tag).width>690&&ts>18){ts-=1;ctx.font='400 '+ts+'px '+DISPLAY}
    outlined(ctx,tag,50,538,'#fff','#000',7);
    /* footer strip */
    var fy=PY+PH-FOOT;
    ctx.fillStyle=t.foot;ctx.fillRect(PX,fy,PW,FOOT);
    ctx.fillStyle=t.line;ctx.fillRect(PX,fy,PW,5);
    ctx.font='400 30px '+DISPLAY;ctx.fillStyle=t.footText;ctx.fillText('unbear.fun · @unbear_token · #UNBEARABLE',44,fy+FOOT/2+4);
    ctx.font='800 15px '+BODY;ctx.fillStyle=t.footSub;ctx.textAlign='right';
    ctx.fillText('$UNBEAR · MEMECOIN · NOT FINANCIAL ADVICE',W-44,fy+FOOT/2+2);
    ctx.restore();/* unclip */
    rr(ctx,PX,PY,PW,PH,24);ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.stroke();
    ctx.restore();
  }

  /* ---------- generator state ---------- */
  var cv=$('card'),ctx=cv.getContext('2d');
  var inp=$('confession'),hin=$('handle'),cnt=$('count-chars'),num=rnd(),theme='neon';
  function state(){return{text:clean(inp.value,MAX).trim(),handle:clean(hin.value,MAXH).trim(),num:num,theme:theme}}
  /* share text carries no link and no cashtag: the link is passed once, via url= (fixes the old double link on X) */
  function shareText(s){return 'My most unbearable bear-market moment: "'+s.text+'" 🐻👢 Confess yours #UNBEARABLE'}
  function render(){
    var s=state();
    drawCard(ctx,s);
    cnt.textContent=Array.from(clean(inp.value,MAX)).length+' / '+MAX;
    $('numlbl').textContent='#'+pad(num);
    $('xshare').href='https://x.com/intent/post?text='+encodeURIComponent(shareText(s))+'&url='+encodeURIComponent(SITE);
    $('tgshare').href='https://t.me/share/url?url='+encodeURIComponent(SITE)+'&text='+encodeURIComponent(shareText(s));
    var off=!s.text;
    ['dl','submit','xshare','tgshare','wshare'].forEach(function(id){var b=$(id);if(b)b.setAttribute('aria-disabled',off?'true':'false')});
  }
  /* keep typed value within limits and on one line */
  function sanitizeField(el,max){
    var v=clean(el.value,max);
    if(v!==el.value){var p=el.selectionStart;el.value=v;try{el.setSelectionRange(Math.min(p,v.length),Math.min(p,v.length))}catch(e){}}
  }
  inp.addEventListener('input',function(){sanitizeField(inp,MAX);render()});
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();inp.blur()}});
  hin.addEventListener('input',function(){sanitizeField(hin,MAXH);render()});
  d.querySelectorAll('input[name="theme"]').forEach(function(r){r.addEventListener('change',function(){if(r.checked){theme=r.value;render()}})});
  $('reroll').addEventListener('click',function(){num=rnd();render()});

  /* ---------- toast ---------- */
  var tt;
  function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},3200)}
  function need(){if(!state().text){toast('Type your confession first 🐻');inp.focus();return false}return true}

  /* ---------- export ---------- */
  function fname(){return 'unbearable-confession-'+pad(num)+'.png'}
  function toBlob(cb){
    try{cv.toBlob(function(b){b?cb(b):toast('Could not export the image. Try another browser.')},'image/png')}
    catch(e){toast('Could not export the image. Open the page via unbear.fun and try again.')}
  }
  $('dl').addEventListener('click',function(){
    if(!need())return;
    render();
    toBlob(function(b){
      var u=URL.createObjectURL(b),a=d.createElement('a');a.href=u;a.download=fname();d.body.appendChild(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(u)},4000);
      toast('Card saved. Submit it to the Wall, or share it anywhere 👢');
    });
  });
  $('xshare').addEventListener('click',function(e){
    if(!need()){e.preventDefault();return}
    render();
    toast('Optional, just for fun: attach your downloaded card image to the post.');
  });
  $('tgshare').addEventListener('click',function(e){
    if(!need()){e.preventDefault();return}
    render();
    toast('Optional, just for fun: attach your downloaded card image in Telegram.');
  });
  /* Submit to the Wall: no backend, so copy the entry and open the public Telegram group */
  function copyText(t,ok,fail){
    function fb(){var ta=d.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';d.body.appendChild(ta);ta.select();var r=false;try{r=d.execCommand('copy')}catch(e){}d.body.removeChild(ta);r?ok():fail()}
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,fb)}else{fb()}
  }
  $('submit').addEventListener('click',function(e){
    if(!need()){e.preventDefault();return}
    render();
    var s=state(),entry='Unbearable Wall entry #'+pad(num)+': "'+s.text+'"'+(s.handle?' by '+s.handle:'');
    copyText(entry,function(){toast('Entry copied. Paste it in the Telegram group and attach your PNG 🏆')},function(){toast('Paste your confession in the Telegram group and attach your PNG 🏆')});
  });
  /* Web Share API with the PNG file (mobile, when supported) */
  var ws=$('wshare'),coarse=window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(max-width: 760px)').matches;
  var canFiles=false;
  try{canFiles=!!(navigator.canShare&&navigator.share&&navigator.canShare({files:[new File([new Blob(['x'],{type:'image/png'})],'t.png',{type:'image/png'})]}))}catch(e){}
  if(canFiles&&coarse){ws.hidden=false;d.body.classList.add('can-share')}
  ws.addEventListener('click',function(){
    if(!need())return;
    render();
    var s=state();
    toBlob(function(b){
      var f=new File([b],fname(),{type:'image/png'});
      var data={files:[f],title:'Unbearable confession #'+pad(num),text:shareText(s)+' '+SITE};
      if(!navigator.canShare(data))data={files:[f]};
      navigator.share(data).catch(function(err){if(err&&err.name!=='AbortError')toast('Sharing failed. Use Download PNG instead.')});
    });
  });

  /* ---------- example wall ---------- */
  var EX=[
    {text:'Sold my BTC at 16k to "buy back lower". Still waiting for lower.',handle:'Harold, 34',num:16000,theme:'red'},
    {text:'Set my stop-loss at the exact bottom. Twice. Same day.',handle:'precision Pete',num:404,theme:'yellow'},
    {text:'Told my wife it was a long-term hold. It was a JPEG of a rock.',handle:'rock collector',num:1337,theme:'bubblegum'},
    {text:'Explained crypto to my grandma. She sold the top. I did not.',handle:"grandma's apprentice",num:2022,theme:'neon'},
    {text:'Zoomed out on the chart to feel better. It got worse.',handle:'anonymous degen',num:777,theme:'yellow'},
    {text:'My portfolio is down so bad my bank app asked if I was okay.',handle:'Dave from accounting',num:9001,theme:'red'},
    {text:'Checked my wallet at 3am. Went back to sleep. Checked again. Still real.',handle:'3am Kevin',num:42,theme:'neon'},
    {text:'Bought the dip. Then the dip had a dip. Then that dip bought me.',handle:'dip connoisseur',num:3000,theme:'bubblegum'}
  ];
  var wall=$('exwall');
  EX.forEach(function(ex){
    var fig=d.createElement('figure');fig.className='excard';
    var c=d.createElement('canvas');c.width=720;c.height=405;
    c.setAttribute('role','img');c.setAttribute('aria-label','Example card: '+ex.text);
    fig.appendChild(c);
    var lab=d.createElement('span');lab.className='exlab';lab.textContent='Example';fig.appendChild(lab);
    var cap=d.createElement('figcaption');
    var q=d.createElement('span');q.textContent='“'+ex.text+'”';cap.appendChild(q);
    var btn=d.createElement('button');btn.type='button';btn.className='remix';btn.textContent='Remix';
    btn.setAttribute('aria-label','Use this example style and text in the generator');
    btn.addEventListener('click',function(){
      inp.value=ex.text;theme=ex.theme;
      var r=d.querySelector('input[name="theme"][value="'+ex.theme+'"]');if(r)r.checked=true;
      render();$('maker').scrollIntoView({behavior:'smooth',block:'start'});
      toast('Loaded. Now make it yours ✍️');
    });
    cap.appendChild(btn);fig.appendChild(cap);wall.appendChild(fig);
    ex.canvas=c;
  });
  function renderExamples(){EX.forEach(function(ex){var x=ex.canvas.getContext('2d');x.setTransform(.6,0,0,.6,0,0);drawCard(x,ex)})}

  function all(){render();renderExamples()}
  imgs.bull.onload=imgs.bear.onload=function(){if(++loaded>=2)all()};
  all();
  if(d.fonts&&d.fonts.load){
    Promise.all([d.fonts.load('400 40px "Luckiest Guy"'),d.fonts.load('800 25px "Open Sans"')]).then(all,all);
    d.fonts.ready.then(all);
  }

  /* expose the renderer for automated previews/tests */
  window.UNBEAR_WALL={draw:drawCard,render:render,setNum:function(n){num=n;render()}};

  /* mobile: give the sticky preview a backdrop only while it is stuck */
  var pv=d.querySelector('.preview'),tk=false;
  function stuck(){tk=false;var nh=parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--nav-h'))||58;pv.classList.toggle('stuck',window.matchMedia('(max-width: 760px)').matches&&pv.getBoundingClientRect().top<=nh+1&&scrollY>0)}
  addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(stuck)}},{passive:true});stuck();

  /* ---------- menu (same behaviour as the home page) ---------- */
  var burger=d.querySelector('.burger'),mobile=window.matchMedia('(max-width: 760px)');
  function setMenu(open){
    d.body.classList.toggle('menu-open',open);
    burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Close menu':'Open menu');
    d.documentElement.style.overflow=open?'hidden':'';
  }
  burger.addEventListener('click',function(){setMenu(!d.body.classList.contains('menu-open'))});
  d.querySelectorAll('.mmenu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  mobile.addEventListener&&mobile.addEventListener('change',function(e){if(!e.matches)setMenu(false)});
})();
