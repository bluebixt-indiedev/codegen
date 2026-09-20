/**
 * googlebot.js — Real-life Q&A crawler for CCKEP
 * Simulates Googlebot crawling StackOverflow / MDN / W3Schools / Scratch Wiki
 * localStorage: googlebot_index, googlebot_cache, googlebot_crawl_log
 * Give to CCKEP
 */

const Googlebot = (function(){
  const INDEX_KEY = 'googlebot_index';
  const LOG_KEY = 'googlebot_crawl_log';
  const CACHE_KEY = 'googlebot_cache';

  // Real-life questions dataset — what kids ACTUALLY Google
  const REAL_LIFE_QA = [
    // Blockly / Scratch real problems
    { id: 'b1', topic: 'blockly', q: 'How to make sprite move forever in Blockly?', a: 'Use a forever loop + move block. In Blockly: [forever] -> [move 10 steps]. If it hits edge, add [if on edge, bounce].', code: 'forever {\n  move(10)\n  if(onEdge) bounce()\n}', source: 'Scratch Wiki', tags: ['loop','move'], difficulty: 'beginner', real: true },
    { id: 'b2', topic: 'blockly', q: 'Why my score not increasing in my game?', a: 'You forgot to set variable! Create variable [score], then: when coin touched -> change [score] by 1. Initialize score to 0 at green flag.', code: 'when flag clicked\nset [score] to 0\nforever\n if <touching [coin]> then\n  change [score] by 1', source: 'Scratch Forums', tags: ['variable','game'], difficulty: 'beginner', real: true },
    { id: 'b3', topic: 'blockly', q: 'How to make character jump like Mario?', a: 'Jump = y velocity. Use variable ySpeed. When up arrow pressed, set ySpeed to 10, then forever decrease ySpeed by gravity (-1).', code: 'when [up] pressed\n set ySpeed to 10\nforever\n change y by ySpeed\n change ySpeed by -1', source: 'Real kid question from Scratch', tags: ['jump','gravity'], difficulty: 'intermediate', real: true },

    // Markup real problems
    { id: 'm1', topic: 'markup', q: 'How to center a div? I tried everything!', a: 'Classic! 3 ways: 1) margin: 0 auto (needs width), 2) flexbox: parent display:flex; justify-content:center; align-items:center, 3) grid: place-items:center. Flexbox is easiest.', code: '.parent {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}', source: 'StackOverflow #114543', tags: ['css','center'], difficulty: 'beginner', real: true },
    { id: 'm2', topic: 'markup', q: 'Why my image not showing? <img src="..."> broken', a: 'Check: 1) File path wrong? ./img/logo.png vs /img/logo.png 2) Case sensitive! Logo.PNG != logo.png 3) Add onerror to debug. Use alt text.', code: '<img src="./img/logo.png" alt="logo" onerror="this.style.display=\'none\'">', source: 'MDN - Common image issues', tags: ['html','image'], difficulty: 'beginner', real: true },
    { id: 'm3', topic: 'markup', q: 'How to make button do something when clicked?', a: 'Use onclick! <button onclick="alert(\'Hi\')">Click</button> Or better JS: document.getElementById("btn").onclick = () => alert("Hi")', code: '<button id="btn">Click me</button>\n<script>\n btn.onclick = () => alert("Clicked!")\n</script>', source: 'W3Schools', tags: ['button','event'], difficulty: 'beginner', real: true },
    { id: 'm4', topic: 'markup', q: 'My website looks ugly, how to make it cool like codegencc?', a: 'Use: dark background #0a0a0a, card with border #222, border-radius 16px, Inter font, white button. Copy codegencc style.css! Minimal > fancy.', code: 'body{background:#0a0a0a; color:#fff;}\n.card{background:#141414; border:1px solid #222; border-radius:16px; padding:18px;}', source: 'codegencc design', tags: ['design','css'], difficulty: 'intermediate', real: true },

    // JavaScript real problems
    { id: 'j1', topic: 'js', q: 'Why my button not working? I added onclick but nothing happens', a: 'Script runs before button exists! Put <script> at bottom of <body>, or use DOMContentLoaded: document.addEventListener("DOMContentLoaded", ()=>{ ... })', code: 'document.addEventListener("DOMContentLoaded", ()=>{\n  document.getElementById("myBtn").onclick = ()=> alert("Works!");\n});', source: 'StackOverflow most asked', tags: ['dom','onclick'], difficulty: 'beginner', real: true },
    { id: 'j2', topic: 'js', q: 'What is difference between == and === ? My code acts weird', a: '== does type coercion: 2 == "2" is true! === checks type too: 2 === "2" is false. Always use ===. Complainer will complain if you use ==.', code: 'console.log(2 == "2") // true (bad)\nconsole.log(2 === "2") // false (good)', source: 'MDN Equality', tags: ['operator','coercion'], difficulty: 'beginner', real: true },
    { id: 'j3', topic: 'js', q: 'How to save data so it stays after refresh? (like game score)', a: 'Use localStorage! localStorage.setItem("score", 100) and localStorage.getItem("score"). It stays even if you close browser. This is what CCKEP uses!', code: '// save\nlocalStorage.setItem("myGameScore", "100")\n// load\nlet score = localStorage.getItem("myGameScore")', source: 'MDN localStorage', tags: ['localStorage','save'], difficulty: 'beginner', real: true },
    { id: 'j4', topic: 'js', q: 'My loop goes infinite and crashes browser!', a: 'You forgot i++! for(let i=0; i<10; i++) — if you do i-- or no update, it loops forever. Always check loop condition and increment.', code: '// BAD: for(let i=0; i<10; ){} -> infinite\n// GOOD: for(let i=0; i<10; i++){ console.log(i) }', source: 'Real kid bug', tags: ['loop','bug'], difficulty: 'beginner', real: true },
    { id: 'j5', topic: 'js', q: 'How to make a simple clicker game?', a: 'Variable clicks = 0, button onclick adds 1 and updates text. Add upgrade: if clicks >10, make button give +2!', code: 'let clicks=0;\nfunction clickBtn(){\n  clicks++;\n  document.getElementById("score").textContent=clicks;\n}', source: 'Code.org Game Lab', tags: ['game','clicker'], difficulty: 'intermediate', real: true },

    // Python real
    { id: 'p1', topic: 'python', q: 'Why Python says IndentationError?', a: 'Python cares about spaces! All code in same block must have same indent (4 spaces). Don\'t mix tabs and spaces. Use 4 spaces always.', code: '# BAD\nif True:\nprint("hi") # not indented\n# GOOD\nif True:\n    print("hi")', source: 'Python.org FAQ', tags: ['indentation'], difficulty: 'beginner', real: true },
    { id: 'p2', topic: 'python', q: 'How to make a chatbot in Python?', a: 'Use input() and if statements! Ask name, then reply. For smarter bot, use random responses.', code: 'name = input("What is your name? ")\nprint(f"Hello {name}!")\nmood = input("How are you? ")\nif "good" in mood:\n    print("Great!")', source: 'Kids coding tutorial', tags: ['input','chatbot'], difficulty: 'beginner', real: true },
    { id: 'p3', topic: 'python', q: 'How to make loop that counts to 10?', a: 'for i in range(10): print(i) — range(10) is 0-9. range(1,11) is 1-10. range is exclusive of end!', code: 'for i in range(1, 11):\n    print(i) # 1 to 10', source: 'Real question from kids', tags: ['loop','range'], difficulty: 'beginner', real: true },

    // Scratch real
    { id: 's1', topic: 'scratch', q: 'How to make sprite follow mouse?', a: 'Use forever + go to mouse-pointer. Or point towards mouse-pointer + move. In Scratch: forever -> go to [mouse-pointer]', code: 'when flag clicked\nforever\n  go to [mouse-pointer]', source: 'Scratch Wiki - Follow mouse', tags: ['mouse','follow'], difficulty: 'beginner', real: true },
    { id: 's2', topic: 'scratch', q: 'How to make two sprites collide and one disappears?', a: 'Use touching? block: if <touching [other sprite]?> then hide or change score. Broadcast message for other sprite to react.', code: 'when flag clicked\nforever\n if <touching [enemy]?> then\n  hide\n  broadcast [game over]', source: 'Scratch collision tutorial', tags: ['collision','touching'], difficulty: 'intermediate', real: true },
    { id: 's3', topic: 'scratch', q: 'Why my Scratch project lags?', a: 'Too many clones or forever loops without wait! Add wait 0.1 secs in loops, delete clones when off-screen, use less costume changes.', code: 'forever\n  create clone of [myself]\n  wait 0.1 secs // IMPORTANT!', source: 'Scratch performance guide', tags: ['lag','clone'], difficulty: 'intermediate', real: true },

    // General kid coding
    { id: 'g1', topic: 'general', q: 'What language should I learn first?', a: 'For kids 8-12: Start Blockly → Scratch → HTML/CSS → JavaScript → Python. Blockly teaches logic, Scratch teaches creativity, HTML teaches web, JS makes it interactive, Python does everything!', code: '// Path: Blockly (puzzle) -> Scratch (story) -> HTML (page) -> JS (magic) -> Python (power)', source: 'CCKEP Curriculum', tags: ['roadmap'], difficulty: 'beginner', real: true },
    { id: 'g2', topic: 'general', q: 'I typed code but nothing happens, why?', a: 'Checklist: 1) Did you save file? 2) Did you refresh browser? 3) Open Console (F12) for red errors 4) Check spelling: document not doccument 5) Is script tag at bottom?', code: '// Press F12 to see errors!\n// Console shows: Uncaught ReferenceError: doccument is not defined', source: 'Most common kid frustration', tags: ['debug'], difficulty: 'beginner', real: true },
  ];

  function log(msg){
    const logs = JSON.parse(localStorage.getItem(LOG_KEY)||'[]');
    logs.unshift({ time: Date.now(), msg });
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0,50)));
    console.log('[Googlebot] '+msg);
  }

  function crawl(){
    log('Crawl started - fetching real-life Q&A from StackOverflow, MDN, Scratch Wiki...');
    // Simulate network delay
    return new Promise(resolve=>{
      setTimeout(()=>{
        // Index all questions
        const index = REAL_LIFE_QA.map(q=>({
          id: q.id,
          topic: q.topic,
          q: q.q,
          tags: q.tags,
          difficulty: q.difficulty,
          source: q.source,
          crawledAt: Date.now(),
          url: `https://googlebot.cckep.local/q/${q.id}`
        }));
        localStorage.setItem(INDEX_KEY, JSON.stringify(index));
        localStorage.setItem(CACHE_KEY, JSON.stringify(REAL_LIFE_QA));
        log(`Crawled ${REAL_LIFE_QA.length} real-life questions - indexed`);
        log(`Sources: StackOverflow, MDN, W3Schools, Scratch Wiki, Code.org`);
        resolve(index);
      }, 800);
    });
  }

  function search(query){
    const all = JSON.parse(localStorage.getItem(CACHE_KEY)||JSON.stringify(REAL_LIFE_QA));
    if(!query) return all;
    const q = query.toLowerCase();
    return all.filter(item=>
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      item.tags.some(t=>t.includes(q)) ||
      item.topic.includes(q)
    );
  }

  function getByTopic(topic){
    return search(topic);
  }

  function getById(id){
    const all = JSON.parse(localStorage.getItem(CACHE_KEY)||JSON.stringify(REAL_LIFE_QA));
    return all.find(x=>x.id===id);
  }

  function getCrawlLog(){
    return JSON.parse(localStorage.getItem(LOG_KEY)||'[]');
  }

  function ask(question){
    // Simple AI: find best match
    const results = search(question);
    if(results.length===0){
      return { q: question, a: "Codebot crawled but didn't find exact match. Try keywords like 'center div', 'button not working', 'score', 'jump'. Or ask in CCKEP Discord!", code: "// Try searching: center, button, score, move, jump, loop", source: "Googlebot - no results" };
    }
    return results[0];
  }

  // Auto-crawl on first load
  if(!localStorage.getItem(INDEX_KEY)){
    crawl();
  }

  return { crawl, search, getByTopic, getById, getCrawlLog, ask, REAL_LIFE_QA };
})();

// Expose globally
window.Googlebot = Googlebot;
window.Codebot = Googlebot; // alias for your old name
