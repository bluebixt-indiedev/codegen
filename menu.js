/**
 * menu.js — Global navigation menu for codegencc
 * Tap to redirect to other pages
 * Injects menu into any page with id="global-menu" or auto-injects at body top
 * localStorage: codegen_current_user, codegen_current_org, codegen_current_repo
 */
(function(){
  const PAGES = [
    { id: 'org', label: 'Organizations', icon: '🏢', href: 'org.html', desc: 'My orgs' },
    { id: 'create-org', label: 'Create Org', icon: '➕', href: 'create-org.html', desc: 'New organization' },
    { id: 'create-repo', label: 'Create Repo', icon: '📦', href: 'create-repo.html', desc: 'New repository' },
    { id: 'repo', label: 'Repository', icon: '📁', href: 'repo.html', desc: 'View repo', dynamic: true },
    { id: 'dash', label: 'Dashboard', icon: '🌐', href: 'dash.html', desc: 'Explore Dashboard like Any Git Platform' },
    { id: 'cckep', label: 'CCKEP Kids', icon: '🧒‍💻', href: 'cckep.html', desc: 'Kids Education + Googlebot' },
    { id: 'migration', label: 'Migrations', icon: '🔀', href: 'migration.html', desc: 'List migrations' },
    { id: 'new-migration', label: 'New Migration', icon: '✨', href: 'new-migration.html', desc: 'Create migration' },
    { id: 'auth', label: 'Auth', icon: '🔐', href: 'auth.html', desc: 'Login / Register' },
  ];

  function getCurrentPage(){
    const path = location.pathname.split('/').pop() || 'org.html';
    return path.split('?')[0];
  }

  function getRepoLink(){
    const lastRepo = JSON.parse(localStorage.getItem('codegen_current_repo')||'null');
    const repos = JSON.parse(localStorage.getItem('codegen_repos')||'[]');
    if(lastRepo && lastRepo.r_id) return `repo.html?r_id=${lastRepo.r_id}`;
    if(repos.length>0 && repos[repos.length-1].r_id) return `repo.html?r_id=${repos[repos.length-1].r_id}`;
    return 'repo.html';
  }

  function renderMenu(){
    const current = getCurrentPage();
    const existing = document.getElementById('global-menu-root');
    if(existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'global-menu-root';
    root.innerHTML = `
      <div class="global-nav">
        <div class="global-nav-left">
          <button id="menu-toggle" class="menu-toggle" aria-label="Menu">☰</button>
          <a href="org.html" class="brand">codegen<span>cc</span></a>
          <span class="sep">/</span>
          <span class="org-name" id="global-current-page">${current}</span>
        </div>
        <div class="global-nav-right">
          <div class="global-nav-links desktop-only">
            ${PAGES.map(p=>{
              const href = p.id==='repo' ? getRepoLink() : p.href;
              const active = current===p.href.split('?')[0] ? 'active' : '';
              return `<a href="${href}" class="nav-link ${active}" data-page="${p.id}"><span class="nav-icon">${p.icon}</span>${p.label}</a>`;
            }).join('')}
          </div>
          <span id="global-user-email" class="muted" style="font-size:11px"></span>
          <button id="menu-logout" class="btn-small ghost" style="display:none">Logout</button>
        </div>
      </div>
      <div id="menu-drawer" class="menu-drawer">
        <div class="menu-drawer-header">
          <strong>codegen<span style="color:#666">cc</span> Menu</strong>
          <button id="menu-close" class="btn-small ghost">✕</button>
        </div>
        <div class="menu-drawer-list">
          ${PAGES.map(p=>{
            const href = p.id==='repo' ? getRepoLink() : p.href;
            const active = current===p.href.split('?')[0] ? 'active' : '';
            return `
            <a href="${href}" class="menu-item ${active}" data-href="${href}">
              <span class="menu-item-icon">${p.icon}</span>
              <div class="menu-item-text">
                <strong>${p.label}</strong>
                <span class="muted">${p.desc}</span>
              </div>
              <span class="menu-item-arrow">›</span>
            </a>`;
          }).join('')}
        </div>
        <div class="menu-drawer-footer">
          <div class="muted" style="font-size:11px">Tap any item to redirect instantly. localStorage: codegen_*</div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <a href="cckep.html" class="btn-small" style="flex:1;text-align:center">CCKEP</a>
            <a href="googlebot.js" class="btn-small ghost" style="flex:1;text-align:center">Googlebot.js</a>
          </div>
        </div>
      </div>
      <div id="menu-overlay" class="menu-overlay"></div>
    `;

    // Inject at top of body
    document.body.insertBefore(root, document.body.firstChild);

    // Events
    const toggle = document.getElementById('menu-toggle');
    const close = document.getElementById('menu-close');
    const drawer = document.getElementById('menu-drawer');
    const overlay = document.getElementById('menu-overlay');
    
    function openDrawer(){
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow='hidden';
    }
    function closeDrawer(){
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow='';
    }
    toggle.onclick = openDrawer;
    close.onclick = closeDrawer;
    overlay.onclick = closeDrawer;

    // Tap to redirect - add ripple effect
    root.querySelectorAll('.menu-item, .nav-link').forEach(el=>{
      el.addEventListener('click', (e)=>{
        // allow default redirect, but show feedback
        const href = el.getAttribute('href') || el.dataset.href;
        if(href){
          e.preventDefault();
          el.style.opacity='0.6';
          setTimeout(()=>{ location.href = href; }, 120);
        }
      });
      // Touch feedback
      el.addEventListener('touchstart', ()=>{ el.style.transform='scale(0.98)'; }, {passive:true});
      el.addEventListener('touchend', ()=>{ el.style.transform=''; }, {passive:true});
    });

    // User email
    const userEmailEl = document.getElementById('global-user-email');
    const cur = localStorage.getItem('codegen_current_user');
    const logoutBtn = document.getElementById('menu-logout');
    if(cur && userEmailEl){
      try{ userEmailEl.textContent = JSON.parse(cur).email; logoutBtn.style.display='inline-block'; }catch{}
    }
    if(logoutBtn){
      logoutBtn.onclick=()=>{
        localStorage.removeItem('codegen_current_user');
        location.href='auth.html';
      };
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', renderMenu);
  }else{
    renderMenu();
  }

  window.GlobalMenu = { render: renderMenu };
})();
