/**
 * anti-kid.js — because the kid don't know how to code
 * codegencc — Build. Complain. Ship.
 * Usage: <script src="anti-kid.js"></script>
 * Stores: codegen_kid_verified, codegen_kid_attempts
 */
(function(){
  const VERIFIED_KEY = 'codegen_kid_verified';
  const ATTEMPTS_KEY = 'codegen_kid_attempts';
  const BLOCKED_KEY = 'codegen_kid_blocked_until';
  const CHALLENGES = [
    { q: "What does typeof null return in JS?", code: "console.log(typeof null);", opts: ["'null'", "'object'", "'undefined'", "'number'"], a: 1, hint: "Classic JS bug from 1995" },
    { q: "What's output?", code: "console.log(2 + '2');", opts: ["4", "'22'", "NaN", "Error"], a: 1, hint: "JS coercion" },
    { q: "const x=5; x=6; What happens?", code: "const x = 5;\nx = 6;", opts: ["x becomes 6", "TypeError", "Works fine", "undefined"], a: 1, hint: "const means const" },
    { q: "Which clones a repo?", code: "git ??? https://codegen.cc/org/repo.git", opts: ["git copy", "git clone", "git download", "git pull"], a: 1, hint: "You use this daily" },
    { q: "Boolean([]) returns?", code: "Boolean([]) // empty array", opts: ["false", "true", "undefined", "0"], a: 1, hint: "Empty array is truthy" },
    { q: "Go var declaration?", code: "??? x int = 5", opts: ["var x int = 5", "let x = 5", "const x := 5", "variable x"], a: 0, hint: "Go not JS" },
    { q: "Fix bug: if (x = 5)", code: "if (x = 5) { }", opts: ["if (x == 5)", "if (x === 5)", "if (x = 5) is fine", "if (x : 5)"], a: 1, hint: "= vs == vs ===" },
    { q: "git push --force does?", code: "// careful...", opts: ["Safely pushes", "Overwrites remote history", "Creates backup", "Pulls first"], a: 1, hint: "Danger" }
  ];
  function getAttempts(){ return parseInt(localStorage.getItem(ATTEMPTS_KEY)||'0'); }
  function addAttempt(){ const n=getAttempts()+1; localStorage.setItem(ATTEMPTS_KEY,String(n)); return n; }
  function isBlocked(){ const until=parseInt(localStorage.getItem(BLOCKED_KEY)||'0'); return Date.now()<until; }
  function pick(){ return [...CHALLENGES].sort(()=>0.5-Math.random()).slice(0,2); }
  let current=pick(); let answered=[null,null];
  function injectStyles(){
    if(document.getElementById('anti-kid-styles')) return;
    const s=document.createElement('style');
    s.id='anti-kid-styles';
    s.textContent="#anti-kid-overlay{position:fixed;inset:0;z-index:99999;background:#0a0a0a;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif}#anti-kid-box{width:100%;max-width:520px;background:#141414;border:1px solid #222;border-radius:16px;padding:24px}#anti-kid-box h2{font-size:18px;color:#fff;margin-bottom:4px}#anti-kid-box .sub{font-size:12px;color:#666;margin-bottom:16px}.kid-challenge{background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:14px;margin-bottom:12px}.kid-challenge pre{background:#000;border-radius:8px;padding:10px;margin:8px 0;font-family:monospace;font-size:12px;color:#aaa;overflow:auto}.kid-opts{display:flex;flex-direction:column;gap:6px;margin-top:8px}.kid-opt{padding:10px 12px;background:#141414;border:1px solid #222;border-radius:8px;color:#aaa;font-size:13px;cursor:pointer;text-align:left}.kid-opt:hover{border-color:#444;color:#fff}.kid-opt.selected{border-color:#fff;background:#fff;color:#000}.kid-opt.correct{border-color:#00ff88;background:#00ff88;color:#000}.kid-opt.wrong{border-color:#ff4444;background:#ff4444;color:#fff}#kid-submit{width:100%;margin-top:12px;padding:12px;background:#fff;color:#000;border:0;border-radius:10px;font-weight:700;cursor:pointer}#kid-submit:disabled{background:#222;color:#555;cursor:not-allowed}.kid-hint{font-size:11px;color:#555;margin-top:4px}.kid-blocked{background:#ff4444;color:#fff;padding:12px;border-radius:10px;font-size:13px;text-align:center;margin-bottom:12px}";
    document.head.appendChild(s);
  }
  function showGate(){
    if(localStorage.getItem(VERIFIED_KEY)==='1') return;
    if(isBlocked()){
      const until=parseInt(localStorage.getItem(BLOCKED_KEY)||'0'); const left=Math.ceil((until-Date.now())/1000);
      document.body.innerHTML='<div id=anti-kid-overlay><div id=anti-kid-box><div class=kid-blocked>⛔ Kid detected. Failed '+getAttempts()+' times. Come back in '+left+'s and go learn HTML first.</div></div></div>'; return;
    }
    injectStyles();
    const overlay=document.createElement('div'); overlay.id='anti-kid-overlay';
    overlay.innerHTML='<div id=anti-kid-box><h2>👶 Anti-Kid Verification</h2><p class=sub>Kid don\'t know how to code. Prove you\'re not a kid. 2 questions, must get both right. localStorage: '+VERIFIED_KEY+'</p><div id=kid-challenges></div><button id=kid-submit disabled>Answer both to continue</button><p class=sub style=margin-top:10px>Attempts: '+getAttempts()+' • Fail 3x = blocked 60s. Real devs only.</p></div>';
    document.body.appendChild(overlay);
    render(); document.getElementById('kid-submit').onclick=verify;
  }
  function render(){
    const container=document.getElementById('kid-challenges');
    container.innerHTML=current.map((c,i)=>'<div class=kid-challenge><strong style=font-size:13px;color:#fff>'+(i+1)+'. '+c.q+'</strong><pre>'+c.code+'</pre><div class=kid-opts id=opts-'+i+'>'+c.opts.map((o,oi)=>'<button class=kid-opt data-opt='+oi+'>'+String.fromCharCode(65+oi)+'. '+o+'</button>').join('')+'</div><div class=kid-hint>💡 '+c.hint+'</div></div>').join('');
    current.forEach((c,ci)=>{
      document.querySelectorAll('#opts-'+ci+' .kid-opt').forEach(btn=>{
        btn.onclick=()=>{ document.querySelectorAll('#opts-'+ci+' .kid-opt').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); answered[ci]=parseInt(btn.dataset.opt); checkReady(); };
      });
    });
  }
  function checkReady(){
    const btn=document.getElementById('kid-submit');
    if(answered[0]!==null && answered[1]!==null){ btn.disabled=false; btn.textContent='Verify — I know how to code'; }else{ btn.disabled=true; btn.textContent='Answer both ('+answered.filter(a=>a!==null).length+'/2)'; }
  }
  function verify(){
    let correct=0;
    current.forEach((c,i)=>{
      const chosen=answered[i];
      document.querySelectorAll('#opts-'+i+' .kid-opt').forEach((b,idx)=>{ if(idx===c.a) b.classList.add('correct'); if(idx===chosen && chosen!==c.a) b.classList.add('wrong'); b.disabled=true; });
      if(chosen===c.a) correct++;
    });
    const btn=document.getElementById('kid-submit');
    if(correct===2){
      localStorage.setItem(VERIFIED_KEY,'1'); localStorage.setItem(ATTEMPTS_KEY,'0');
      btn.textContent='Verified ✓ Welcome, dev'; btn.style.background='#00ff88';
      setTimeout(()=>{ document.getElementById('anti-kid-overlay')?.remove(); window.dispatchEvent(new Event('anti-kid-verified')); },800);
    }else{
      const n=addAttempt(); btn.textContent='Failed '+correct+'/2 — attempts '+n+'/3'; btn.style.background='#ff4444'; btn.style.color='#fff';
      if(n>=3){ localStorage.setItem(BLOCKED_KEY,String(Date.now()+60000)); setTimeout(()=>location.reload(),1500); }
      else{ setTimeout(()=>{ current=pick(); answered=[null,null]; render(); checkReady(); btn.textContent='Try again — learn to code first'; btn.style.background='#fff'; btn.style.color='#000'; btn.disabled=true; },1500); }
    }
  }
  window.AntiKid={ isVerified:()=>localStorage.getItem(VERIFIED_KEY)==='1', reset:()=>{ localStorage.removeItem(VERIFIED_KEY); localStorage.removeItem(ATTEMPTS_KEY); localStorage.removeItem(BLOCKED_KEY); location.reload(); }, show:showGate };
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',showGate); }else{ showGate(); }
})();