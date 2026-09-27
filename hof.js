/* $UNBEAR Hall of Fame: renders halloffame.json into #hof-list. Keeps the static empty-state card if there are no picks
   (or if the file can't be loaded). All text goes in via textContent, never as HTML. */
(function(){
  var d=document,list=d.getElementById('hof-list');
  /* OG Bear note: switch to "closed" wording after launch (Thu 8 Oct 2026 20:00 Warsaw = 18:00 UTC) */
  var T=Date.UTC(2026,9,8,18,0,0);
  if(Date.now()>=T){
    var og=d.getElementById('og-text'),b=d.getElementById('og-btn');
    if(og){og.textContent='The OG Bear list closed at launch (Thu 8 Oct 2026, 20:00 Warsaw time). Thanks to the first 100 who joined early. The title stays in the Telegram group.'}
    if(b){b.textContent='Open the Telegram →'}
  }
  if(!list||!window.fetch)return;
  function el(tag,cls,txt){var e=d.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
  var HOF_URL='https://unbear.fun/#halloffame';
  var IMG=/^assets\/halloffame\/[A-Za-z0-9._-]+\.(webp|png|jpe?g)$/;
  function card(p,wk){
    var type=p.type==='bingo'?'bingo':'wall';
    var a=el('article','hof-card hof-'+type);
    var top=el('div','hof-top');
    top.appendChild(el('span','hof-type',type==='bingo'?'Bingo card':'Wall confession'));
    if(wk)top.appendChild(el('span','hof-wk',wk));
    a.appendChild(top);
    if(typeof p.image==='string'&&IMG.test(p.image)){
      var im=el('img','hof-img');im.src=p.image;im.alt=(type==='bingo'?'Bingo card':'Confession card')+' by '+String(p.nick||'');im.loading='lazy';im.width=1200;im.height=675;a.appendChild(im);
    }
    if(type==='bingo'&&p.score!=null&&!isNaN(p.score)){
      var s=el('div','hof-score');s.appendChild(el('b','display',String(Math.max(0,Math.min(25,Math.round(+p.score))))));s.appendChild(el('span',null,'/ 25'));
      if(p.seed)s.appendChild(el('small',null,'card #'+String(p.seed).slice(0,12)));
      a.appendChild(s);
    }
    if(p.text)a.appendChild(el('blockquote','hof-quote','“'+String(p.text).slice(0,220)+'”'));
    var by=el('p','hof-by');by.appendChild(d.createTextNode('by '));by.appendChild(el('strong',null,String(p.nick).slice(0,32)));
    if(p.source==='telegram'||p.source==='wall')by.appendChild(el('span','hof-src',p.source==='telegram'?' · via Telegram':' · via the Wall'));
    a.appendChild(by);
    /* per-pick share: plain intent links, clean URL (no tracking params) */
    var nick=String(p.nick).slice(0,32),q=p.text?' “'+String(p.text).slice(0,110)+(String(p.text).length>110?'…':'')+'”':'';
    var st='Featured in the Unbearable Hall of Fame: '+(type==='bingo'?'a Bingo card':'a confession')+' by '+nick+q+' 🏆🐻 #UNBEARABLE';
    var sh=el('div','hof-share');sh.appendChild(el('span',null,'Share'));
    var x=el('a','sbtn sbtn-x','X');x.href='https://x.com/intent/post?text='+encodeURIComponent(st)+'&url='+encodeURIComponent(HOF_URL);
    var tg=el('a','sbtn sbtn-tg','Telegram');tg.href='https://t.me/share/url?url='+encodeURIComponent(HOF_URL)+'&text='+encodeURIComponent(st);
    [x,tg].forEach(function(l){l.target='_blank';l.rel='noopener';l.setAttribute('aria-label','Share this pick by '+nick+' on '+l.textContent);sh.appendChild(l)});
    a.appendChild(sh);
    return a;
  }
  fetch('halloffame.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
    var weeks=(j&&Array.isArray(j.weeks))?j.weeks:[],frag=d.createDocumentFragment(),n=0;
    weeks.slice(0,6).forEach(function(w,i){
      var picks=(w&&Array.isArray(w.picks))?w.picks.filter(function(p){return p&&p.nick}):[];
      if(!picks.length)return;
      var sec=el('div','hof-week'+(i===0?' hof-latest':''));
      var h=el('h3','hof-wtitle display');h.appendChild(el('span',null,i===0?'Latest':'Earlier'));h.appendChild(d.createTextNode(' '+String(w.label||'')));
      sec.appendChild(h);
      var g=el('div','hof-grid');picks.forEach(function(p){g.appendChild(card(p,null));n++});
      sec.appendChild(g);frag.appendChild(sec);
    });
    if(n){list.textContent='';list.appendChild(frag)}
  }).catch(function(){});
})();
