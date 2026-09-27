/* $UNBEAR site script. Scroll-reveal and zoom-on-scroll logic adapted from the BleameX (Dawn-based) theme's animations.js. */
(function(){
  var d=document,$=function(id){return d.getElementById(id)};
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile=window.matchMedia('(max-width: 760px)');

  /* Countdown to Thu 8 Oct 2026 20:00 Europe/Warsaw (CEST, UTC+2) = 18:00 UTC */
  var T=Date.UTC(2026,9,8,18,0,0);
  function p(n){return (n<10?'0':'')+n}
  function tick(){
    var s=Math.floor((T-Date.now())/1000);
    if(s<=0){$('count').innerHTML='<div style="flex:1"><b style="font-size:22px">Launch time!</b><span>Contract: check this page + @unbear_token</span></div>';$('mc-t').textContent='LIVE';return}
    var dd=Math.floor(s/86400),hh=p(Math.floor(s%86400/3600)),mm=p(Math.floor(s%3600/60)),ss=p(s%60);
    $('cd-d').textContent=dd;$('cd-h').textContent=hh;$('cd-m').textContent=mm;$('cd-s').textContent=ss;
    $('mc-t').textContent=dd+'d '+hh+':'+mm+':'+ss;
    setTimeout(tick,1000-(Date.now()%1000));
  }
  tick();

  /* Toast + copy helpers */
  var tt;
  function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},2800)}
  function copyText(t,ok){
    function fb(){var ta=d.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';d.body.appendChild(ta);ta.select();try{d.execCommand('copy');ok()}catch(e){toast('Select and copy manually')}d.body.removeChild(ta)}
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,fb)}else{fb()}
  }
  d.querySelectorAll('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var old=b.textContent;
      copyText($(b.dataset.copy).textContent.trim(),function(){b.textContent='Copied!';b.classList.add('done');toast('Project wallet address copied');setTimeout(function(){b.textContent=old;b.classList.remove('done')},1600)});
    });
  });

  /* Contract box. Placeholder until launch.
     AT LAUNCH: set data-ca="0x..." on <button id="ca"> and replace the text of #ca-text in index.html. */
  $('ca').addEventListener('click',function(){
    var ca=this.getAttribute('data-ca');
    if(!ca){
      toast('Not live yet. The address is revealed Thu 8 Oct, 20:00 Warsaw time. Any address before that is fake.');
      $('ca-tap').textContent='Coming soon';setTimeout(function(){$('ca-tap').textContent='Tap to copy'},2200);return;
    }
    copyText(ca,function(){$('ca-tap').textContent='Copied!';toast('Contract address copied. Double-check it on @unbear_token.')});
  });

  /* Full-screen menu */
  var burger=d.querySelector('.burger');
  function setMenu(open){
    d.body.classList.toggle('menu-open',open);
    burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Close menu':'Open menu');
    d.documentElement.style.overflow=open?'hidden':'';
  }
  burger.addEventListener('click',function(){setMenu(!d.body.classList.contains('menu-open'))});
  d.querySelectorAll('.mmenu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  mobile.addEventListener&&mobile.addEventListener('change',function(e){if(!e.matches)setMenu(false)});

  /* Tap-to-wiggle stickers (works on touch, no hover needed) */
  d.querySelectorAll('.sticker,#bull').forEach(function(el){
    el.addEventListener('click',function(){el.classList.remove('wiggle');void el.offsetWidth;el.classList.add('wiggle');setTimeout(function(){el.classList.remove('wiggle')},520)});
  });

  /* Scroll reveal: BleameX/Dawn scroll-trigger (IntersectionObserver + cascade order) */
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(entries,obs){
      entries.forEach(function(en,i){
        var t=en.target;
        if(en.isIntersecting){
          if(t.classList.contains('scroll-trigger--offscreen')){
            t.classList.remove('scroll-trigger--offscreen');
            if(t.hasAttribute('data-cascade'))t.style.setProperty('--animation-order',i);
          }
          obs.unobserve(t);
        }else{t.classList.add('scroll-trigger--offscreen')}
      });
    },{rootMargin:'0px 0px -50px 0px'});
    [].forEach.call(d.getElementsByClassName('scroll-trigger'),function(t){io.observe(t)});
    /* Fee bar fill + touch "seen" glow on cards */
    var io2=new IntersectionObserver(function(entries,obs){
      entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('seen','in');obs.unobserve(en.target)}});
    },{threshold:.35});
    d.querySelectorAll('.card').forEach(function(c){io2.observe(c)});
  }else{d.querySelectorAll('.card').forEach(function(c){c.classList.add('in')})}

  /* Zoom-in on scroll (BleameX/Dawn animate--zoom-in) + sticky mini countdown + active bottom-nav tab */
  var zoom=$('zoom'),zv=false,ticking=false;
  function pctSeen(el){var vh=innerHeight,r=el.getBoundingClientRect();if(r.top>vh)return 0;if(r.bottom<0)return 100;return Math.round((vh-r.top)/((vh+r.height)/100))}
  if(!reduce&&'IntersectionObserver' in window){new IntersectionObserver(function(es){zv=es[0].isIntersecting}).observe(zoom)}
  var secs=['buy','how','receipts','proofs','contest','wall','faq','links','risk'],map={how:'buy',receipts:'proofs',wall:'contest',faq:'contest',links:'contest',risk:'contest'};
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      if(zv)zoom.style.setProperty('--zoom-in-ratio',1+0.002*pctSeen(zoom));
      $('mcount').classList.toggle('show',scrollY>innerHeight*.8);
      if(mobile.matches){
        var cur='top';
        secs.forEach(function(id){var e=$(id);if(e&&e.getBoundingClientRect().top<innerHeight*.45)cur=id});
        cur=map[cur]||cur;
        d.querySelectorAll('.bnav a[data-sec]').forEach(function(a){a.classList.toggle('on',a.dataset.sec===cur)});
      }
    });
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* Meme slider: arrows + counter on desktop, swipe + dots on mobile */
  var sl=$('slider'),slides=sl.children,dots=$('dots');
  for(var i=0;i<slides.length;i++){dots.appendChild(d.createElement('i'))}
  function stepW(){var g=parseFloat(getComputedStyle(sl).columnGap)||16;return slides[0].getBoundingClientRect().width+g}
  function upd(){
    var w=stepW(),idx=Math.round(sl.scrollLeft/w),max=sl.scrollWidth-sl.clientWidth,vis=Math.max(1,Math.floor((sl.clientWidth+8)/w));
    if(sl.scrollLeft>=max-4)idx=slides.length-vis;
    var last=Math.min(idx+vis,slides.length);
    $('counter').textContent=(vis>1?(idx+1)+'–'+last:(idx+1))+' / '+slides.length;
    $('prev').disabled=sl.scrollLeft<=4;$('next').disabled=sl.scrollLeft>=max-4;
    [].forEach.call(dots.children,function(dt,k){dt.classList.toggle('on',k===Math.min(idx,slides.length-1))});
  }
  $('prev').addEventListener('click',function(){sl.scrollBy({left:-stepW(),behavior:'smooth'})});
  $('next').addEventListener('click',function(){sl.scrollBy({left:stepW(),behavior:'smooth'})});
  sl.addEventListener('scroll',function(){requestAnimationFrame(upd)},{passive:true});
  addEventListener('resize',upd);upd();
})();
