/ ===== FULL ANTI-BOT =====
let startTime=Date.now();
let mouseMoves=0;
let checkboxTime=0;
let mathAnswer=0;
let sliderDone=false;
let checkboxDone=false;
let mathDone=false;

function genMath(){
  const a=Math.floor(Math.random()*10)+2;
  const b=Math.floor(Math.random()*10)+2;
  mathAnswer=a+b;
  document.getElementById('bot-q').textContent=`${a} + ${b} =`;
  document.getElementById('bot-answer').value='';
  mathDone=false;
  updateGate();
}
genMath();
document.getElementById('bot-refresh').onclick=genMath;

document.addEventListener('mousemove',()=>{ mouseMoves++; document.getElementById('bot-moves').textContent=mouseMoves+' moves'; updateGate(); },{passive:true});
document.addEventListener('touchmove',()=>{ mouseMoves++; document.getElementById('bot-moves').textContent=mouseMoves+' moves'; updateGate(); },{passive:true});

// checkbox with timing
document.getElementById('bot-checkbox').addEventListener('change',e=>{
  if(e.target.checked){
    checkboxTime=Date.now();
    if(Date.now()-startTime<1000){
      e.target.checked=false;
      document.getElementById('msg').textContent='Too fast - bots click instantly. Wait a sec and try again.';
      return;
    }
    checkboxDone=true;
    document.getElementById('bot-dot').style.background='#00ff88';
  }else{ checkboxDone=false; document.getElementById('bot-dot').style.background='#333'; }
  updateGate();
});

// math input
document.getElementById('bot-answer').addEventListener('input',e=>{
  mathDone = parseInt(e.target.value)===mathAnswer;
  updateGate();
});

// slider drag
(function(){
  const track=document.getElementById('slider-track');
  const thumb=document.getElementById('slider-thumb');
  const fill=document.getElementById('slider-fill');
  let dragging=false;
  function setPos(x){
    const rect=track.getBoundingClientRect();
    let p=(x-rect.left)/rect.width;
    p=Math.max(0,Math.min(1,p));
    thumb.style.left=(p*100)+'%';
    fill.style.width=(p*100)+'%';
    if(p>0.92){ sliderDone=true; thumb.textContent='✓'; thumb.style.background='#fff'; document.getElementById('slider-label').textContent='Verified ✓'; }
    else{ if(!sliderDone) { thumb.textContent='›'; } }
    updateGate();
  }
  thumb.addEventListener('mousedown',e=>{dragging=true; e.preventDefault();});
  window.addEventListener('mousemove',e=>{ if(dragging) setPos(e.clientX); });
  window.addEventListener('mouseup',()=>dragging=false);
  thumb.addEventListener('touchstart',()=>dragging=true,{passive:true});
  window.addEventListener('touchmove',e=>{ if(dragging) setPos(e.touches[0].clientX); },{passive:true});
  window.addEventListener('touchend',()=>dragging=false);
  track.addEventListener('click',e=>setPos(e.clientX));
})();

// timer
setInterval(()=>{
  const s=((Date.now()-startTime)/1000).toFixed(1);
  document.getElementById('bot-timer').textContent=s+'s human time';
  updateGate();
},100);

function getAttempts(){
  const arr=JSON.parse(localStorage.getItem(ATTEMPTS_KEY)||'[]');
  const now=Date.now();
  const recent=arr.filter(t=>now-t<60000);
  localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(recent));
  return recent;
}
function addAttempt(){
  const arr=getAttempts();
  arr.push(Date.now());
  localStorage.setItem(ATTEMPTS_KEY,JSON.stringify(arr));
  document.getElementById('bot-attempts').textContent=arr.length+'/5 attempts';
}

function updateGate(){
  const timeOk = (Date.now()-startTime)>2000;
  const movesOk = mouseMoves>5;
  const attempts=getAttempts();
  const rateOk = attempts.length<5;
  const hpEmpty = document.getElementById('hp-field').value.trim()==='';
  const all = timeOk && movesOk && checkboxDone && mathDone && sliderDone && hpEmpty && rateOk;
  
  document.getElementById('bot-attempts').textContent=attempts.length+'/5 attempts';
  
  const status=document.getElementById('bot-status');
  const loginBtn=document.getElementById('login-btn');
  const regBtn=document.getElementById('reg-btn');
  
  if(!rateOk){ status.textContent='Rate limited'; status.style.background='#ff4444'; loginBtn.disabled=true; regBtn.disabled=true; loginBtn.textContent='Wait 60s - too many attempts'; regBtn.textContent='Wait 60s - too many attempts'; return; }
  if(!hpEmpty){ status.textContent='Bot detected'; status.style.background='#ff4444'; return; }
  
  if(all){
    status.textContent='Human verified ✓'; status.style.background='#00ff88'; status.style.color='#000';
    loginBtn.disabled=false; regBtn.disabled=false;
    loginBtn.textContent='Log In ✓'; regBtn.textContent='Create Account ✓';
  }else{
    let missing=[];
    if(!timeOk) missing.push('wait 2s');
    if(!movesOk) missing.push('move mouse');
    if(!checkboxDone) missing.push('check box');
    if(!mathDone) missing.push('solve math');
    if(!sliderDone) missing.push('slide');
    status.textContent=missing.join(' • '); status.style.background='#222'; status.style.color='#aaa';
    loginBtn.disabled=true; regBtn.disabled=true;
    loginBtn.textContent='Verify to Log In ('+missing[0]+')';
    regBtn.textContent='Verify to Create ('+missing[0]+')';
  }
}

// ===== FORM SUBMITS WITH BOT CHECK =====
function finalBotCheck(){
  const hp=document.getElementById('hp-field').value.trim();
  if(hp!=='') return {ok:false, reason:'Honeypot filled - bot detected'};
  if((Date.now()-startTime)<2000) return {ok:false, reason:'Form submitted too fast'};
  if(!checkboxDone) return {ok:false, reason:'Checkbox not verified'};
  if(!mathDone) return {ok:false, reason:'Math answer wrong'};
  if(!sliderDone) return {ok:false, reason:'Slider not completed'};
  if(mouseMoves<5) return {ok:false, reason:'No human movement detected'};
  const attempts=getAttempts();
  if(attempts.length>=5) return {ok:false, reason:'Rate limited - wait 60s'};
  return {ok:true};
}

document.getElementById('form-login').addEventListener('submit',e=>{
  e.preventDefault();
  const check=finalBotCheck();
  if(!check.ok){ addAttempt(); document.getElementById('msg').textContent='Bot check failed: '+check.reason; genMath(); return; }
  addAttempt();
  const email=document.getElementById('login-email').value.toLowerCase().trim();
  const pass=document.getElementById('login-password').value;
  const u=getUsers().find(u=>u.email===email && u.password===pass);
  if(!u){ document.getElementById('msg').textContent='Wrong email or password'; return; }
  localStorage.setItem(CURRENT_KEY,JSON.stringify({email, verifiedAt:Date.now()}));