/* $UNBEAR "Unbearable Bingo": client-side 5x5 bear-market sin card + 1200x675 share image.
   Nothing is uploaded or stored on a server. Card state is kept in localStorage on this device only.
   Safety: all text is drawn on canvas or set via textContent. Never innerHTML. */
(function(){
  'use strict';
  var d=document,$=function(id){return d.getElementById(id)};
  var W=1200,H=675,SITE='https://unbear.fun/bingo.html';
  var DISPLAY='"Luckiest Guy", Impact, "Arial Black", sans-serif';
  var BODY='"Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  /* ---------- the sins ---------- */
  var SINS=[
    'Sold the bottom','Bought the top','Checked charts at a wedding','Said "this time is different"','Lost my seed phrase',
    'Revenge traded','Zoomed out. It got worse.','Stop-loss hit the exact low','Explained crypto at dinner','Aped in because of the logo',
    'Checked my wallet at 3am','Deleted the app. Reinstalled.','Called a dump a "hold"','Screenshotted gains. Never sold.','Told family "it\u2019s just a dip"',
    'Paid more gas than I traded','Hid my bags from my partner','Trusted a "100x" guy','Sent funds to the wrong chain','Averaged down 7 times',
    'FOMO\u2019d into a green candle','Panic sold, then it pumped','Clicked a "claim airdrop" link','Drew chart lines for 3 hours','Swore off crypto. Lied.',
    'Checked price during a movie','Bought a JPEG of a rock','Held to zero "on principle"','Cried at a red candle','Took advice from a random DM',
    'Charts in the bathroom','Named a pet after a coin','Ignored all my price alerts','Bought because a celeb tweeted','"Long-term investor" for 2 days'
  ];

  /* Community squares: weekly picks from confessions submitted on the Unbearable Wall (wall.html).
     Add entries like {text:'Sold my BTC at 16k', by:'Harold'} (keep text under ~40 chars, credit by nickname only,
     never a real name without consent). They join the random pool for every card. Empty for now. */
  var COMMUNITY_SQUARES = [
    /* {text:'Example community sin', by:'nickname', week:'2026-W42'} */
  ];

  var FREE='SO WE LEFT';
  var LINES=[];
  for(var r=0;r<5;r++){LINES.push([0,1,2,3,4].map(function(c){return r*5+c}))}
  for(var c=0;c<5;c++){LINES.push([0,1,2,3,4].map(function(r){return r*5+c}))}
  LINES.push([0,6,12,18,24],[4,8,12,16,20]);

  /* ---------- seeded random ---------- */
  var ALPH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function newSeed(){var a=new Uint32Array(5),s='';if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(a);else for(var i=0;i<5;i++)a[i]=Math.floor(Math.random()*1e9);for(var j=0;j<5;j++)s+=ALPH[a[j]%ALPH.length];return s}
  function cleanSeed(s){s=String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);return s.length>=3?s:''}
  function hash(str){var h1=0xdeadbeef,h2=0x41c6ce57;for(var i=0;i<str.length;i++){var ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);return h1>>>0}
  function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function buildCard(seed){
    var pool=SINS.map(function(t){return{text:t}}).concat(COMMUNITY_SQUARES.filter(function(q){return q&&q.text}).map(function(q){return{text:String(q.text).slice(0,60),by:q.by?String(q.by).slice(0,24):''}}));
    var rnd=mulberry(hash('unbear:'+seed));
    for(var i=pool.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=pool[i];pool[i]=pool[j];pool[j]=t}
    var pick=pool.slice(0,24);pick.splice(12,0,{text:FREE,free:true});
    return pick;
  }

  /* ---------- state ---------- */
  var seed,cells,marks;
  function load(){
    var q=cleanSeed(new URLSearchParams(location.search).get('seed')),saved=null;
    try{saved=JSON.parse(localStorage.getItem('unbear_bingo')||'null')}catch(e){}
    if(q){seed=q;marks=(saved&&saved.seed===q&&Array.isArray(saved.marks))?saved.marks:[]}
    else if(saved&&cleanSeed(saved.seed)){seed=cleanSeed(saved.seed);marks=Array.isArray(saved.marks)?saved.marks:[]}
    else{seed=newSeed();marks=[]}
    setup();
  }
  function setup(){
    cells=buildCard(seed);
    var m=[];for(var i=0;i<25;i++)m[i]=i===12?true:!!marks[i];marks=m;
  }
  function save(){try{localStorage.setItem('unbear_bingo',JSON.stringify({seed:seed,marks:marks}))}catch(e){}}
  function score(){return marks.filter(Boolean).length}
  function doneLines(){return LINES.filter(function(l){return l.every(function(i){return marks[i]})})}
  function verdict(n,lines){
    if(n===25)return'FULLY UNBEARABLE';
    if(n>=18)return'CERTIFIED BAG HOLDER';
    if(n>=12)return'SEVERELY UNBEARABLE';
    if(n>=7)return'MODERATELY UNBEARABLE';
    if(n>=3)return'MILDLY UNBEARABLE';
    return'SUSPICIOUSLY INNOCENT';
  }

  /* ---------- drawing helpers ---------- */
  function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function wrap(ctx,text,maxW){
    var words=text.split(' ').filter(Boolean),lines=[],line='';
    words.forEach(function(w){
      while(ctx.measureText(w).width>maxW){var ch=Array.from(w),cut=ch.length;while(cut>1&&ctx.measureText(ch.slice(0,cut).join('')+'-').width>maxW)cut--;if(line){lines.push(line);line=''}lines.push(ch.slice(0,cut).join('')+'-');w=ch.slice(cut).join('')}
      var t=line?line+' '+w:w;if(ctx.measureText(t).width<=maxW)line=t;else{if(line)lines.push(line);line=w}
    });
    if(line)lines.push(line);return lines;
  }
  function outlined(ctx,text,x,y,fill,stroke,lw){ctx.lineJoin='round';ctx.miterLimit=2;ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.strokeText(text,x,y);ctx.fillStyle=fill;ctx.fillText(text,x,y)}
  function star(ctx,cx,cy,spikes,ro,ri,rot){ctx.beginPath();for(var i=0;i<spikes*2;i++){var r=i%2?ri:ro,a=rot+i*Math.PI/spikes;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}ctx.closePath()}
  var imgs={bull:new Image(),bear:new Image()};
  imgs.bull.src='assets/bull_sticker.webp';imgs.bear.src='assets/bear_sticker.webp';

  /* ---------- the 1200x675 card ---------- */
  function drawCard(ctx){
    var n=score(),lines=doneLines().length,full=n===25;
    var PX=16,PY=16,PW=W-32,PH=H-32,FOOT=64;
    ctx.save();ctx.textBaseline='middle';ctx.textAlign='left';
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    rr(ctx,PX,PY,PW,PH,24);ctx.save();ctx.clip();
    ctx.fillStyle='#0a1f5c';ctx.fillRect(0,0,W,H);
    var cx=930,cy=380,k;ctx.fillStyle='#0f2b7a';
    for(k=0;k<30;k+=2){var a1=k*2*Math.PI/30,a2=(k+1)*2*Math.PI/30;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a1)*1600,cy+Math.sin(a1)*1600);ctx.lineTo(cx+Math.cos(a2)*1600,cy+Math.sin(a2)*1600);ctx.closePath();ctx.fill()}
    ctx.fillStyle='rgba(57,255,20,.2)';
    for(var y=PY;y<H;y+=20){for(var x=PX+((y/20)%2?10:0);x<W;x+=20){var dB=Math.hypot(x-(PX+PW),y-PY),dA=Math.hypot(x-(PX+PW),y-(PY+PH)),rad=Math.max(6.5-dB/70,6-dA/80,0);if(rad>.6){ctx.beginPath();ctx.arc(x,y,rad,0,7);ctx.fill()}}}
    /* title tag */
    ctx.save();ctx.translate(40,58);ctx.rotate(-.02);ctx.font='400 36px '+DISPLAY;
    var title='UNBEARABLE BINGO',tw=ctx.measureText(title).width;
    ctx.font='800 17px '+BODY;var sw=ctx.measureText('CARD #'+seed).width;
    var tl=tw+sw+70;
    ctx.fillStyle='#000';ctx.fillRect(7,-19,tl,54);ctx.fillStyle='#39ff14';ctx.fillRect(0,-26,tl,54);ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.strokeRect(0,-26,tl,54);
    ctx.font='400 36px '+DISPLAY;ctx.fillStyle='#000';ctx.fillText(title,20,4);
    ctx.font='800 17px '+BODY;ctx.fillStyle='#000';ctx.fillText('CARD #'+seed,tw+46,2);
    ctx.restore();
    /* the grid */
    var gx=44,gy=104,cw=104,ch=92,gap=6;
    ctx.fillStyle='#000';rr(ctx,gx-10+8,gy-10+10,5*cw+4*gap+20,5*ch+4*gap+20,18);ctx.fill();
    ctx.fillStyle='#fff';rr(ctx,gx-10,gy-10,5*cw+4*gap+20,5*ch+4*gap+20,18);ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.stroke();
    var win={};doneLines().forEach(function(l){l.forEach(function(i){win[i]=1})});
    cells.forEach(function(cell,i){
      var x=gx+(i%5)*(cw+gap),y=gy+Math.floor(i/5)*(ch+gap),on=marks[i];
      rr(ctx,x,y,cw,ch,10);
      ctx.fillStyle=cell.free?'#000':on?(win[i]?'#39ff14':'#ffe600'):'#eef3ff';ctx.fill();
      ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.stroke();
      ctx.textAlign='center';
      if(cell.free){ctx.font='400 22px '+DISPLAY;ctx.fillStyle='#39ff14';ctx.fillText('SO WE',x+cw/2,y+ch/2-10);ctx.fillText('LEFT',x+cw/2,y+ch/2+16);return}
      if(on){ctx.save();ctx.translate(x+cw/2,y+ch/2);ctx.rotate(-.35);ctx.strokeStyle='rgba(255,46,63,.75)';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,cw/2-6,ch/2-10,0,0,7);ctx.stroke();ctx.restore()}
      var fs=16,ls,avail=ch-(cell.by?22:14),words=cell.text.split(' ');
      for(;fs>=9;fs--){ctx.font='800 '+fs+'px '+BODY;
        var fitsWords=words.every(function(w){return ctx.measureText(w).width<=cw-12});
        ls=wrap(ctx,cell.text,cw-12);if(fitsWords&&ls.length*fs*1.12<=avail)break}
      if(fs<9){fs=10;ctx.font='800 10px '+BODY;ls=wrap(ctx,cell.text,cw-12)}
      var maxL=Math.floor(avail/(fs*1.12));if(ls.length>maxL){ls=ls.slice(0,maxL);ls[maxL-1]=ls[maxL-1].replace(/.$/,'…')}
      var lh=fs*1.12,y0=y+ch/2-(ls.length-1)*lh/2-(cell.by?6:0);
      ctx.fillStyle=on?'#000':'#26314d';
      ls.forEach(function(l,k){ctx.fillText(l,x+cw/2,y0+k*lh)});
      if(cell.by){ctx.font='700 10px '+BODY;ctx.fillStyle='#55607a';ctx.fillText('by '+cell.by,x+cw/2,y+ch-10)}
    });
    ctx.textAlign='left';
    /* bull kicks bear */
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineCap='round';
    [[930,400,1010,330,8],[960,440,1050,370,6],[900,360,960,300,5]].forEach(function(l){ctx.lineWidth=l[4];ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke()});
    if(imgs.bull.naturalWidth){var uw=300,uh=uw*imgs.bull.naturalHeight/imgs.bull.naturalWidth;ctx.drawImage(imgs.bull,640,296,uw,uh)}
    ctx.save();ctx.translate(935,398);star(ctx,0,0,12,58,36,-.2);ctx.fillStyle='#000';ctx.save();ctx.translate(4,5);ctx.fill();ctx.restore();ctx.fillStyle='#ffe600';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.stroke();ctx.rotate(-.2);ctx.textAlign='center';ctx.font='400 25px '+DISPLAY;outlined(ctx,'BONK!',0,3,'#ff2e3f','#000',6);ctx.restore();
    if(imgs.bear.naturalWidth){var bw=220,bh=bw*imgs.bear.naturalHeight/imgs.bear.naturalWidth;ctx.save();ctx.translate(1092,352);ctx.rotate(.42);ctx.drawImage(imgs.bear,-bw/2,-bh/2,bw,bh);ctx.restore()}
    /* score bubble */
    var bx=606,by=100,bw2=548,bh2=206,br=30,tipX=735,tipY=346;
    function bubble(){ctx.beginPath();ctx.moveTo(bx+br,by);ctx.arcTo(bx+bw2,by,bx+bw2,by+bh2,br);ctx.arcTo(bx+bw2,by+bh2,bx,by+bh2,br);ctx.lineTo(790,by+bh2);ctx.lineTo(tipX,tipY);ctx.lineTo(730,by+bh2);ctx.arcTo(bx,by+bh2,bx,by,br);ctx.arcTo(bx,by,bx+bw2,by,br);ctx.closePath()}
    ctx.save();ctx.translate(9,11);bubble();ctx.fillStyle='#000';ctx.fill();ctx.restore();
    bubble();ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#0b0b12';
    ctx.font='400 88px '+DISPLAY;var big=n+'/25',bwid=ctx.measureText(big).width;
    ctx.fillText(big,bx+bw2/2,by+70);
    ctx.font='400 34px '+DISPLAY;ctx.fillText('UNBEARABLE SINS',bx+bw2/2,by+136);
    ctx.font='800 20px '+BODY;ctx.fillStyle='#ff2e3f';ctx.fillText(verdict(n,lines),bx+bw2/2,by+176);
    /* bingo badge */
    if(lines>0){
      ctx.save();ctx.translate(1100,104);ctx.rotate(.16);star(ctx,0,0,14,74,56,0);ctx.fillStyle='#ff2e3f';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.stroke();
      ctx.font='400 '+(full?24:30)+'px '+DISPLAY;outlined(ctx,full?'FULL':'BINGO!',0,full?-10:-4,'#ffe600','#000',6);
      ctx.font='800 15px '+BODY;ctx.fillStyle='#fff';ctx.fillText(full?'BINGO!':(lines+(lines>1?' LINES':' LINE')),0,full?16:22);ctx.restore();
    }
    ctx.textAlign='left';
    /* footer */
    var fy=PY+PH-FOOT;ctx.fillStyle='#000';ctx.fillRect(PX,fy,PW,FOOT);ctx.fillStyle='#39ff14';ctx.fillRect(PX,fy,PW,5);
    ctx.font='400 30px '+DISPLAY;ctx.fillStyle='#39ff14';ctx.fillText('unbear.fun/bingo · @unbear_token · #UNBEARABLE',44,fy+FOOT/2+4);
    ctx.font='800 15px '+BODY;ctx.fillStyle='#9fb3d9';ctx.textAlign='right';ctx.fillText('JUST FOR FUN · NOT FINANCIAL ADVICE',W-44,fy+FOOT/2+2);
    ctx.restore();
    rr(ctx,PX,PY,PW,PH,24);ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.stroke();
    ctx.restore();
  }

  /* ---------- UI ---------- */
  var grid=$('bgrid'),cv=$('bcard'),cx2=cv.getContext('2d'),prevLines=0,btns=[];
  function shareText(){return 'I scored '+score()+'/25 on the Unbearable Bingo 🐻👢 How unbearable was your bear market? unbear.fun/bingo.html #UNBEARABLE'}
  function buildGrid(){
    while(grid.firstChild)grid.removeChild(grid.firstChild);btns=[];
    cells.forEach(function(cell,i){
      var b=d.createElement('button');b.type='button';b.className='bcell'+(cell.free?' free':'');
      var t=d.createElement('span');t.className='bt';t.textContent=cell.free?FREE:cell.text;b.appendChild(t);
      if(cell.by){var by=d.createElement('small');by.textContent='by '+cell.by;b.appendChild(by);b.classList.add('community')}
      if(cell.free){b.disabled=true;b.setAttribute('aria-label','Free square: so we left')}
      else b.addEventListener('click',function(){marks[i]=!marks[i];save();update(true)});
      grid.appendChild(b);btns.push(b);
    });
  }
  function update(user){
    var done=doneLines(),n=score(),win={};done.forEach(function(l){l.forEach(function(i){win[i]=1})});
    btns.forEach(function(b,i){b.setAttribute('aria-pressed',marks[i]?'true':'false');b.classList.toggle('on',!!marks[i]);b.classList.toggle('win',!!win[i])});
    $('bscore').textContent=n+'/25';$('bscore2').textContent=n+'/25';
    $('bverdict').textContent=verdict(n,done.length);
    $('bseed').textContent='#'+seed;
    var st=$('bstatus');
    st.textContent=n===25?'FULL BINGO! Maximum unbearable.':done.length?('BINGO! '+done.length+(done.length>1?' lines':' line')+' complete.'):'Tap every sin you committed. Get 5 in a row for BINGO.';
    st.classList.toggle('hit',done.length>0);
    if(user&&done.length>prevLines){toast(n===25?'FULL BINGO! The bear has been fully kicked out 👢':'BINGO! 🐻👢');grid.classList.remove('boom');void grid.offsetWidth;grid.classList.add('boom')}
    prevLines=done.length;
    $('xshare').href='https://x.com/intent/post?text='+encodeURIComponent(shareText());
    drawCard(cx2);
  }
  function newCard(s){seed=s||newSeed();marks=[];setup();save();buildGrid();prevLines=0;update(false);
    try{history.replaceState(null,'',location.pathname)}catch(e){}}
  $('bnew').addEventListener('click',function(){newCard();toast('Fresh card #'+seed)});
  $('breset').addEventListener('click',function(){marks=[];setup();save();prevLines=0;update(false);toast('Marks cleared')});

  var tt;function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},3000)}
  function fname(){return 'unbearable-bingo-'+seed+'-'+score()+'of25.png'}
  function toBlob(cb){try{cv.toBlob(function(b){b?cb(b):toast('Could not export the image.')},'image/png')}catch(e){toast('Could not export the image. Open the page via unbear.fun and try again.')}}
  $('dl').addEventListener('click',function(){drawCard(cx2);toBlob(function(b){var u=URL.createObjectURL(b),a=d.createElement('a');a.href=u;a.download=fname();d.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);toast('Card saved 👢')})});
  $('xshare').addEventListener('click',function(){toast('Optional: attach your downloaded card image to the post.')});
  var ws=$('wshare'),coarse=window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(max-width: 760px)').matches,canFiles=false;
  try{canFiles=!!(navigator.canShare&&navigator.share&&navigator.canShare({files:[new File([new Blob(['x'],{type:'image/png'})],'t.png',{type:'image/png'})]}))}catch(e){}
  if(canFiles&&coarse)ws.hidden=false;
  ws.addEventListener('click',function(){drawCard(cx2);toBlob(function(b){var f=new File([b],fname(),{type:'image/png'}),data={files:[f],title:'Unbearable Bingo',text:shareText()};if(!navigator.canShare(data))data={files:[f]};navigator.share(data).catch(function(e){if(e&&e.name!=='AbortError')toast('Sharing failed. Use Download PNG instead.')})})});

  load();buildGrid();prevLines=doneLines().length;update(false);
  var redraw=function(){drawCard(cx2)};imgs.bull.onload=imgs.bear.onload=redraw;
  if(d.fonts&&d.fonts.load){Promise.all([d.fonts.load('400 40px "Luckiest Guy"'),d.fonts.load('800 16px "Open Sans"')]).then(redraw,redraw);d.fonts.ready.then(redraw)}
  window.UNBEAR_BINGO={newCard:newCard,mark:function(list){marks=[];list.forEach(function(i){marks[i]=true});setup();save();update(false)},sins:SINS.length};

  /* ---------- menu ---------- */
  var burger=d.querySelector('.burger'),mobile=window.matchMedia('(max-width: 760px)');
  function setMenu(open){d.body.classList.toggle('menu-open',open);burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Close menu':'Open menu');d.documentElement.style.overflow=open?'hidden':''}
  burger.addEventListener('click',function(){setMenu(!d.body.classList.contains('menu-open'))});
  d.querySelectorAll('.mmenu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  mobile.addEventListener&&mobile.addEventListener('change',function(e){if(!e.matches)setMenu(false)});
})();
