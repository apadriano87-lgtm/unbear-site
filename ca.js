/* $UNBEAR contract-address loader (all pages).
   AT LAUNCH: edit only /ca.json, e.g.
     {"address":"0x…40 hex…","live":true,"explorer":"https://robinhoodchain.blockscout.com/token/0x…","chart":"https://dexscreener.com/robinhood/0x…","sablier":null}
   Once the Sablier stream exists (and only then), set "sablier" to its https URL (e.g. the app.sablier.com stream page).
   That switches every [data-sab-hide]/[data-sab-show] pair from "will be locked… at launch" to "locked", fills
   [data-sab-link] links, turns the commitments-table "at launch" marker into ✓ and enables "Verify Sablier lock".
   "sablier" works independently of "address".
   The JSON is fetched with a cache-busting query (?t=Date.now()) and cache:'no-store', so it shows up even while
   GitHub Pages still serves the cached HTML (max-age=600). Until "address" holds a valid 0x address, nothing changes and
   the static "coming soon" text stays (that is also the no-JS fallback).
   Markup hooks: [data-ca-slot="text|short|mini|full"], [data-ca-hide], [data-ca-show][hidden], #ca/#ca-text/#ca-note, .vbtn[data-verify=contract].
   All values go in via textContent / validated https URLs only. */
(function(){
  'use strict';
  var d=document;
  function ok(u){return typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)}
  function short(a){return a.slice(0,6)+'…'+a.slice(-4)}
  function el(t,c,x){var e=d.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function toast(m){var t=d.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('show')},2800)}
  function copy(txt,btn){
    function done(){if(btn){var o=btn.textContent;btn.textContent='Copied!';btn.classList.add('done');setTimeout(function(){btn.textContent=o;btn.classList.remove('done')},1600)}toast('Contract address copied. Always compare it with unbear.fun.')}
    function fb(){var ta=el('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';d.body.appendChild(ta);ta.select();try{d.execCommand('copy');done()}catch(e){window.prompt('Copy the contract address:',txt)}d.body.removeChild(ta)}
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(done,fb);else fb();
  }
  function link(href,txt){var a=el('a','ca-link',txt);a.href=href;a.target='_blank';a.rel='noopener';return a}
  function apply(j){
    var a=j&&typeof j.address==='string'?j.address.trim():'';
    if(!/^0x[0-9a-fA-F]{40}$/.test(a))return;
    var ex=ok(j.explorer)?j.explorer:'https://robinhoodchain.blockscout.com/token/'+a,ch=ok(j.chart)?j.chart:null;
    d.documentElement.classList.add('ca-live');
    d.querySelectorAll('[data-ca-hide]').forEach(function(e){e.hidden=true});
    d.querySelectorAll('[data-ca-show]').forEach(function(e){e.hidden=false});
    d.querySelectorAll('[data-ca-slot]').forEach(function(s){
      var k=s.getAttribute('data-ca-slot');
      if(k==='text'){s.textContent=a;return}
      if(k==='short'){s.textContent=short(a);return}
      if(k==='mini'){s.textContent='CA: '+short(a);return}
      /* full: address + copy button + explorer (+ chart) link */
      s.textContent='';s.classList.add('ca-full');
      s.appendChild(el('span','mono ca-addr',a));
      var b=el('button','copy ca-copy','Copy');b.type='button';b.setAttribute('aria-label','Copy the $UNBEAR contract address');
      b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();copy(a,b)});
      s.appendChild(b);s.appendChild(link(ex,'Explorer ↗'));if(ch)s.appendChild(link(ch,'Chart ↗'));
    });
    /* the big contract box on the home page (main.js copies data-ca on tap) */
    var box=d.getElementById('ca'),t=d.getElementById('ca-text');
    if(box&&t){box.setAttribute('data-ca',a);t.textContent=a;t.classList.remove('soon');t.classList.add('ca-addr-big');
      var tap=d.getElementById('ca-tap');if(tap)tap.textContent='Tap to copy';
      var lk=d.getElementById('ca-links');if(lk){lk.textContent='';lk.appendChild(link(ex,'View on explorer ↗'));if(ch)lk.appendChild(link(ch,'Chart ↗'));lk.hidden=false}}
    d.querySelectorAll('.vbtn[data-verify="contract"]').forEach(function(v){v.href=ex;v.target='_blank';v.rel='noopener';v.removeAttribute('aria-disabled');v.removeAttribute('role');var s=v.querySelector('.vs');if(s)s.textContent='Open'});
  }
  /* Sablier dev-buy lock: never shown as done until ca.json carries the real stream URL */
  function applySab(j){
    var u=j&&j.sablier;if(!ok(u))return;
    d.documentElement.classList.add('sab-live');
    d.querySelectorAll('[data-sab-hide]').forEach(function(e){e.hidden=true});
    d.querySelectorAll('[data-sab-show]').forEach(function(e){e.hidden=false});
    d.querySelectorAll('a[data-sab-link]').forEach(function(a){a.href=u;a.target='_blank';a.rel='noopener'});
    d.querySelectorAll('.vbtn[data-verify="sablier-lock"]').forEach(function(v){v.href=u;v.target='_blank';v.rel='noopener';v.removeAttribute('aria-disabled');v.removeAttribute('role');var s=v.querySelector('.vs');if(s)s.textContent='Open'});
  }
  function run(j){try{applySab(j)}catch(e){}apply(j)}
  if(!window.fetch)return;
  fetch('/ca.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(run).catch(function(){});
  window.UNBEAR_CA={apply:apply,applySablier:applySab};
})();
