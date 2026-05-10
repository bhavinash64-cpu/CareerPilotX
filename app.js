// ═══════════════════════════════════════════
// CAREER PILOT — CORE ENGINE
// ═══════════════════════════════════════════

// ═══ STATE ═══
const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days
const PRO_AMOUNT_PAISE = 9900;
const CHECKOUT_TTL_MS = 15 * 60 * 1000;
const PAYMENT_VERIFY_SALT = 'cp-pro-checkout-v1';
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Section title map for contextual toolbar
const SECTION_TITLES = {
  resume: '📄 Resume Builder',
  cover: '✉️ Cover Letter',
  email: '📧 Email Generator',
  bio: '📱 Bio Tools',
  skillgap: '🎯 Skill Gap',
  chat: 'AI Coach',
  interview: '📚 Resume Resources',
  gps: '🧠 Career GPS',
  profile: '👤 My Profile'
};

const state = {
  plan:'free', theme:'dark',
  auth:{provider:null,guestStartedAt:null,lastActivityAt:null},
  ui:{lastPage:'landing', sidebarCollapsed: false},
  billing:{lastOutcome:'idle',activeCheckout:null,consumedSessionIds:[]},
  user:{name:'Guest User',email:'guest@careerpilot.ai',initials:'G', photoStyle:'style1'},
  stats:{resumes:0,downloads:0,tools:0,ats:'—'}, profileStrength:20,
  currentTemplate:'minimal', resumeGenerated:false, resumeColor:'#22c55e',
  resumeFont:"'Georgia',serif", resumeSpacing:1.5,
  resumePhotoSize:52, resumePhotoShape:'circle', resumePhoto:null, showResumePhoto:false,
  sectionOrder:['summary','experience','education','skills','projects','certifications','achievements','languages'],
  sectionVisibility:{summary:true,experience:true,education:true,skills:true,projects:true,certifications:true,achievements:true,languages:true},
  versions:[], chatHistory:[], docs:[]
};

// ═══ TEMPLATES CONFIG ═══
const TEMPLATES = [
  // Free templates (8)
  {id:'minimal',name:'Minimal',free:true, category:'minimal'},
  {id:'modern',name:'Modern',free:true, category:'modern'},
  {id:'creative',name:'Creative',free:true, category:'creative'},
  {id:'professional',name:'Professional',free:true, category:'ats'},
  {id:'minimal-blue',name:'Minimal Blue',free:true, category:'minimal'},
  {id:'fresher',name:'Fresher',free:true, category:'minimal'},
  {id:'classic-serif',name:'Classic Serif',free:true, category:'minimal'},
  {id:'two-column',name:'Two Column',free:true, category:'minimal'},
  // Pro templates (existing)
  {id:'corporate',name:'Corporate',free:false, category:'ats'},
  {id:'tech',name:'Tech',free:false, category:'modern'},
  {id:'executive',name:'Executive',free:false, category:'ats'},
  {id:'designer',name:'Designer',free:false, category:'creative'},
  {id:'academic',name:'Academic',free:false, category:'ats'},
  {id:'startup',name:'Startup',free:false, category:'modern'},
  {id:'elegant',name:'Elegant',free:false, category:'premium'},
  {id:'bold',name:'Bold',free:false, category:'premium'},
  {id:'infographic',name:'Infographic',free:false, category:'creative'},
  {id:'compact',name:'Compact',free:false, category:'minimal'},
  {id:'google-blue',name:'Google Blue',free:false, category:'ats'},
  {id:'google-modern',name:'Google Modern',free:false, category:'ats'},
  {id:'google-standard',name:'Google Standard',free:false, category:'ats'},
  {id:'silicon-valley',name:'Silicon Valley',free:false, category:'modern'},
  {id:'tokyo-nights',name:'Tokyo Nights',free:false, category:'modern'},
  {id:'premium-gold',name:'Premium Gold',free:false, category:'premium'},
  {id:'academic-classic',name:'Academic Classic',free:false, category:'ats'},
  // NEW templates
  {id:'kara-elegant',name:'Kara Elegant',free:false, category:'premium'},
  {id:'nadia-framed',name:'Nadia Framed',free:false, category:'premium'},
  {id:'chris-purple',name:'Chris Purple',free:false, category:'premium'},
  {id:'michael-modern',name:'Michael Modern',free:false, category:'modern'},
  {id:'yellow-bold',name:'Yellow Bold',free:false, category:'creative'},
  {id:'nordic-clean',name:'Nordic Clean',free:false, category:'minimal'},
  {id:'coral-creative',name:'Coral Creative',free:false, category:'creative'},
  {id:'midnight-pro',name:'Midnight Pro',free:false, category:'premium'},
];

const FEATURES = [
  {icon:'📄',name:'Resume Builder',desc:'15+ templates, live preview, drag & drop, PDF + image export',tag:'POPULAR',tagCls:'tag-green',section:'resume'},
  {icon:'🎯',name:'Skill Gap',desc:'Compare your skills vs job requirements',tag:'NEW',tagCls:'tag-green',section:'skillgap'},
  {icon:'🤖',name:'AI Career Coach',desc:'Personalized guidance, Q&A, salary tips',tag:'PRO',tagCls:'tag-pro',section:'chat'},
  {icon:'📚',name:'Resume Resources',desc:'Get the best resources and websites for resume building',tag:'HOT',tagCls:'tag-hot',section:'interview'},
  {icon:'🧠',name:'Career GPS',desc:'Map your path from current to dream role',tag:'PRO',tagCls:'tag-pro',section:'gps'},
  {icon:'📧',name:'Email Generator',desc:'Application, follow-up, referral emails',tag:'FAST',tagCls:'tag-green',section:'email'},
  {icon:'✉️',name:'Cover Letter',desc:'Personalized cover letters for any role and company',tag:'NEW',tagCls:'tag-green',section:'cover'},
  {icon:'📱',name:'Bio Generator',desc:'Professional Instagram & Facebook bios',tag:'NEW',tagCls:'tag-green',section:'bio'},
  {icon:'👤',name:'My Profile',desc:'Manage your professional data & identity',tag:'ME',tagCls:'tag-green',section:'profile'},
];

function saveToDocHub(name, type, content) {
  const doc = { id: Date.now(), name, type, date: new Date().toLocaleDateString(), content };
  state.docs.unshift(doc);
  if (state.docs.length > 50) state.docs.pop();
  saveState();
  renderDocHub();
}

function renderDocHub() {
  const list = document.getElementById('docList');
  const empty = document.getElementById('docEmptyState');
  if (!list) return;
  
  if (state.docs.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  if (empty) empty.style.display = 'none';
  const icons = { Resume: '📄', 'Cover Letter': '✉️', Email: '📧', Report: '📊', Bio: '📱' };
  
  list.innerHTML = state.docs.map(doc => `
    <div class="doc-card">
      <div class="doc-icon">${icons[doc.type] || '📁'}</div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}</div>
        <div class="doc-meta">${doc.type} · ${doc.date}</div>
      </div>
      <div class="doc-actions">
        <button class="doc-btn" onclick="deleteDoc(${doc.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function deleteDoc(id) {
  state.docs = state.docs.filter(d => d.id !== id);
  saveState();
  renderDocHub();
  showToast('🗑️', 'Document deleted');
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme();
  renderFeatureGrid(); renderTemplates(); renderSectionOrder();
  renderDocHub();
  renderProfile();
  applySidebarState();
  startGuestSessionWatch();

  // Initialize Firebase (graceful fallback if not configured)
  if (typeof initFirebase === 'function') {
    initFirebase();
  }
  startSessionMonitor();
  checkEntryExperience();
});

let isInitialLoad = true;
function checkEntryExperience() {
  const overlay = document.getElementById('entryOverlay');
  if(!overlay) return;
  if(isAuthenticated()) {
    if(isInitialLoad) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    } else {
      overlay.classList.add('fade-out');
      document.body.style.overflow = '';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 800);
    }
  } else {
    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
    document.body.style.overflow = 'hidden';
  }
  isInitialLoad = false;
}

function handleEntryClick() {
  openAuth();
}

function isAuthenticated(){
  const p=state.auth&&state.auth.provider;
  return p==='google'||p==='guest';
}
function checkSessionExpiry(){
  if(!isAuthenticated())return false;
  
  if(state.auth.provider==='guest'){
    if(state.auth.guestStartedAt && Date.now()-state.auth.guestStartedAt>=GUEST_TTL_MS){
      purgeSession('Guest session ended. Your data was cleared.');
      return true;
    }
  } else if(state.auth.provider==='google'){
    // 6-day inactivity timeout
    if(state.auth.lastActivityAt && Date.now()-state.auth.lastActivityAt>=SESSION_TTL_MS){
      purgeSession('Session expired due to inactivity. Please sign in again.');
      return true;
    }
  }
  return false;
}
function purgeSession(msg){
  try{localStorage.removeItem('cpState');}catch(e){}
  state.auth = {provider:null,guestStartedAt:null,lastActivityAt:null};
  saveState();
  if(msg) showToast('⏱️',msg);
  setTimeout(()=>location.reload(),1500);
}
function startSessionMonitor(){
  setInterval(()=>{
    if(checkSessionExpiry())return;
    updateGuestBanner();
  },60000); // Check every minute
}
function updateActivity(){
  if(isAuthenticated()){
    state.auth.lastActivityAt = Date.now();
  }
}
function enforceLandingOnly(){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const land=document.getElementById('landing');
  const dash=document.getElementById('dashboard');
  if(land)land.classList.add('active');
  if(dash)dash.classList.remove('active');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const nl=document.querySelector('.nav-link[data-nav="landing"]');
  if(nl)nl.classList.add('active');
}
function setActivePage(id){
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const nav=document.querySelector(`.nav-link[data-nav="${id}"]`);
  if(nav)nav.classList.add('active');

  // Smooth transition between pages
  const currentPage = document.querySelector('.page.active');
  const targetPage = document.getElementById(id);

  if(currentPage && targetPage && currentPage !== targetPage){
    currentPage.style.opacity = '0';
    currentPage.style.transform = 'translateY(8px)';
    setTimeout(()=>{
      currentPage.classList.remove('active');
      targetPage.classList.add('active');
      targetPage.style.opacity = '0';
      targetPage.style.transform = 'translateY(8px)';
      requestAnimationFrame(()=>{
        targetPage.style.opacity = '1';
        targetPage.style.transform = 'translateY(0)';
      });
      window.scrollTo({top:0, behavior:'smooth'});
    }, 120);
  } else if(targetPage){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    targetPage.classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  if(id==='dashboard'){
    applyState();
    // Ensure a section is active
    const activeSection = document.querySelector('.dash-section.active');
    if(!activeSection){
      switchSection('resume', null);
    }
  }
  updateGuestBanner();
}
function applyAuthUI(){
  const isAuth = isAuthenticated();
  document.body.classList.toggle('is-authed', isAuth);
  const signInBtn = document.getElementById('navSignInBtn');
  const ctaBtn = document.getElementById('navCtaBtn');

  if(signInBtn) signInBtn.style.display = isAuth ? 'none' : 'block';
  if(ctaBtn) ctaBtn.style.display = isAuth ? 'none' : 'block';

  // Show/hide dashboard link in nav
  const dashLink = document.querySelector('.nav-link[data-nav="dashboard"]');
  if(dashLink) dashLink.style.display = isAuth ? 'block' : 'none';

  checkEntryExperience();
}
function updateGuestBanner(){
  const el=document.getElementById('guestSessionBanner');
  if(!el)return;
  if(state.auth?.provider!=='guest'||!state.auth.guestStartedAt){
    el.hidden=true;
    return;
  }
  const left=GUEST_TTL_MS-(Date.now()-state.auth.guestStartedAt);
  if(left<=0){purgeGuestSession();return;}
  el.hidden=false;
  const t=document.getElementById('guestSessionTTL');
  if(t){
    const h=Math.floor(left/3600000);
    const m=Math.floor((left%3600000)/60000);
    t.textContent=h+'h '+m+'m';
  }
}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem('cpState')||'{}');
    Object.assign(state,s);
    if(!state.auth||typeof state.auth!=='object')state.auth={provider:null,guestStartedAt:null};
    if(state.auth.guestStartedAt!=null&&typeof state.auth.guestStartedAt!=='number')state.auth.guestStartedAt=null;
    if(!state.ui||typeof state.ui!=='object')state.ui={lastPage:'landing', sidebarCollapsed: false};
    if(checkSessionExpiry())return;
    
    // Update activity on load to keep session alive
    updateActivity();
    
    normalizeBillingState();
    if(!isAuthenticated()){
      state.ui.lastPage='landing';
      saveState();
      enforceLandingOnly();
    }else if(state.ui.lastPage==='dashboard'){
      setActivePage('dashboard');
    }else{
      setActivePage('landing');
    }
    applyAuthUI();
    applyState();
    applyTheme();
    updateGuestBanner();
  }catch(e){
    enforceLandingOnly();
    applyAuthUI();
    applyState();
    applyTheme();
  }
}
function saveState(){
  try{
    updateActivity();
    localStorage.setItem('cpState',JSON.stringify(state));
  }catch(e){}
}

function normalizeBillingState(){
  if(state.plan==='premium')state.plan='pro';
  if(state.plan!=='free'&&state.plan!=='pro')state.plan='free';
  delete state.selectedPlan;
  if(!state.billing||typeof state.billing!=='object'){
    state.billing={lastOutcome:'idle',activeCheckout:null,consumedSessionIds:[]};
  }
  if(!Array.isArray(state.billing.consumedSessionIds))state.billing.consumedSessionIds=[];
  const lo=state.billing.lastOutcome;
  if(lo!=='idle'&&lo!=='cancelled'&&lo!=='verify_failed')state.billing.lastOutcome='idle';
  const ac=state.billing.activeCheckout;
  if(ac!=null){
    if(typeof ac!=='object'||Array.isArray(ac))state.billing.activeCheckout=null;
    else if(typeof ac.sessionId!=='string'||typeof ac.amountPaise!=='number'||typeof ac.createdAtMs!=='number'){
      state.billing.activeCheckout=null;
    }
  }
}

function applyState(){
  const isPro=state.plan==='pro';
  
  // Update Profile UI
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarPlan = document.getElementById('sidebarUserPlan');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  
  if(sidebarName) sidebarName.textContent = state.user.name;
  if(sidebarPlan) {
    sidebarPlan.textContent = isPro ? 'Pro Plan' : 'Free Plan';
    sidebarPlan.className = 'profile-plan ' + (isPro ? 'pro' : 'free');
  }
  
  if(sidebarAvatar) {
    sidebarAvatar.textContent = state.user.initials;
    const styles = {
      style1: 'linear-gradient(135deg, #22c55e, #16a34a)',
      style2: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      style3: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      style4: 'linear-gradient(135deg, #ec4899, #db2777)',
      style5: 'linear-gradient(135deg, #f59e0b, #d97706)',
      style6: 'linear-gradient(135deg, #10b981, #059669)',
      style7: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      style8: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      style9: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      style10: 'linear-gradient(135deg, #84cc16, #65a30d)'
    };
    sidebarAvatar.style.background = styles[state.user.photoStyle] || styles.style1;
  }

  // Update Stats & Strength (if elements exist)
  if (document.getElementById('statResumes')) document.getElementById('statResumes').textContent=state.stats.resumes;
  if (document.getElementById('statDownloads')) document.getElementById('statDownloads').textContent=state.stats.downloads;
  if (document.getElementById('statTools')) document.getElementById('statTools').textContent=state.stats.tools;
  if (document.getElementById('statATS')) document.getElementById('statATS').textContent=state.stats.ats;
  if (document.getElementById('strengthPct')) document.getElementById('strengthPct').textContent=state.profileStrength+'%';
  if (document.getElementById('strengthBar')) document.getElementById('strengthBar').style.width=state.profileStrength+'%';

  // Sync Resume Photo UI
  const photoToggle = document.getElementById('photoToggle');
  if(photoToggle) photoToggle.classList.toggle('on', !!state.showResumePhoto);
  const photoImg = document.getElementById('photoImg');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  if(state.resumePhoto && photoImg && photoPlaceholder){
    photoImg.src = state.resumePhoto;
    photoImg.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  }
  
  renderProfile();
  updateSubscriptionUI();
  updateGuestBanner();
  updatePricingUI();

  // Default to resume section if no section is active
  const activeSection = document.querySelector('.dash-section.active');
  if (!activeSection) {
    switchSection('resume', null);
  }
}

// ═══ SIDEBAR COLLAPSE ═══
function toggleSidebar(){
  state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
  applySidebarState();
  saveState();
}

function applySidebarState(){
  const sidebar = document.getElementById('sidebar');
  if(!sidebar) return;
  if(state.ui.sidebarCollapsed){
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }
}

// ═══ NAVIGATION ═══
function showPage(id){
  if(id==='dashboard'&&!isAuthenticated()){openAuth();return;}
  setActivePage(id);
  if(isAuthenticated()){state.ui.lastPage=id;saveState();}
}
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) {
    const navHeight = 64;
    const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
function requestDashboardTool(section){
  if(!isAuthenticated()){
    state.pendingTool = section;
    openAuth();
    return;
  }
  showPage('dashboard');
  if(section){
    setTimeout(()=>switchSection(section,null), 100);
  }
}

// PRO-only tools list
const PRO_ONLY_SECTIONS = ['chat', 'gps'];

function switchSection(name,btn){
  if(!isAuthenticated()){openAuth();return;}
  
  // Tool Access Control: gate PRO-only tools
  if(PRO_ONLY_SECTIONS.includes(name) && state.plan === 'free'){
    openUpgrade();
    showToast('🔒', 'This tool requires a Pro plan');
    return;
  }

  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(b=>b.classList.remove('active'));
  const sidebarBtn = document.querySelector(`.sidebar-item[data-section="${name}"]`);
  if(sidebarBtn) sidebarBtn.classList.add('active');

  // Update contextual toolbar breadcrumb
  const titleEl = document.getElementById('toolbarSectionTitle');
  if(titleEl) titleEl.innerHTML = SECTION_TITLES[name] || name;

  // Smooth transition between sections
  const currentSection = document.querySelector('.dash-section.active');
  const target = document.getElementById('sec-'+name);

  if(currentSection && target && currentSection !== target){
    currentSection.classList.remove('active');
    target.classList.add('active');
    const main = document.querySelector('.dash-main');
    if(main) main.scrollTo({top:0, behavior:'smooth'});
  } else if(target){
    document.querySelectorAll('.dash-section').forEach(s=>s.classList.remove('active'));
    target.classList.add('active');
    const main = document.querySelector('.dash-main');
    if(main) main.scrollTo({top:0, behavior:'smooth'});
  }

  saveState();
}

// ═══ MODALS ═══
function openAuth(){document.getElementById('authModal').classList.add('open');}
function openUpgrade(){
  if(!isAuthenticated()){openAuth();return;}
  renderUpgradeModal();
  document.getElementById('upgradeModal').classList.add('open');
}
function openModal(id){
  if(id==='aiImproveModal'&&!isAuthenticated()){openAuth();return;}
  document.getElementById(id).classList.add('open');
}
function openImproveFabSafe(){
  if(!isAuthenticated()){openAuth();return;}
  openModal('aiImproveModal');
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.addEventListener('click',e=>{
    if(e.target!==m)return;
    if(m.id==='upgradeModal')closeUpgradeModal();
    else m.classList.remove('open');
  });
});
function closeUpgradeModal(){
  const el=document.getElementById('upgradeModal');
  if(!el)return;
  if(state.billing?.activeCheckout&&state.plan!=='pro')cancelProCheckout('modal_closed');
  el.classList.remove('open');
}
async function loginUserGoogle(){
  closeModal('authModal');
  closeModal('guestWarnModal');

  // Try Firebase Google sign-in first
  if (typeof firebaseGoogleSignIn === 'function' && typeof isFirebaseConfigured === 'function' && isFirebaseConfigured()) {
    const success = await firebaseGoogleSignIn();
    if (success) {
      applyAuthUI();
      if(state.pendingTool){
        const tool = state.pendingTool;
        state.pendingTool = null;
        showPage('dashboard');
        setTimeout(()=>switchSection(tool,null), 150);
      } else {
        showToast('🚀', 'Welcome back! You can now edit your resume or access all tools from the Dashboard.');
      }
      return;
    }
    // If Firebase fails, fall through to local simulation
  }

  // Local simulation fallback
  state.auth={provider:'google',guestStartedAt:null};
  state.user={name:'Priya Sharma',email:'priya@gmail.com',initials:'PS', photoStyle: state.user?.photoStyle || 'style1'};
  saveState();
  applyAuthUI();

  if(state.pendingTool){
    const tool = state.pendingTool;
    state.pendingTool = null;
    showPage('dashboard');
    setTimeout(()=>switchSection(tool,null), 150);
  } else {
    showToast('🚀', 'Welcome back! You can now edit your resume or access all tools from the Dashboard.');
  }
  showToast('✈','Signed in with Google — your data stays on this device until you clear it.');
}
function beginGuestLogin(){
  closeModal('authModal');
  document.getElementById('guestWarnModal').classList.add('open');
}
function confirmGuestSession(){
  closeModal('guestWarnModal');
  state.auth={provider:'guest',guestStartedAt:Date.now()};
  state.user={name:'Guest User',email:'guest@careerpilot.ai',initials:'G'};
  saveState();
  applyAuthUI();

  if(state.pendingTool){
    const tool = state.pendingTool;
    state.pendingTool = null;
    showPage('dashboard');
    setTimeout(()=>switchSection(tool,null), 150);
  } else {
    showToast('🚀', 'Guest session started! You can now edit your resume or access all tools from the Dashboard.');
  }
  showToast('👤','Guest mode — data is removed after 24 hours. Use Google sign-in to keep it.');
  updateGuestBanner();
}
function switchGuestToGoogle(){
  closeModal('guestWarnModal');
  openAuth();
}
function renderUpgradeModal(){
  const body=document.getElementById('upgradeModalBody');
  if(!body)return;
  if(state.plan==='pro'){
    body.innerHTML=`<div class="upgrade-flow text-center">
      <div class="upgrade-hero-icon" aria-hidden="true">✅</div>
      <div class="modal-title">You're on Pro</div>
      <p class="modal-sub">All Pro tools and templates are unlocked on this device.</p>
      <button type="button" class="btn btn-primary upgrade-full-btn" onclick="closeUpgradeModal()">Done</button>
    </div>`;
    return;
  }
  if(state.billing.lastOutcome==='cancelled'&&!state.billing.activeCheckout){
    body.innerHTML=`<div class="upgrade-flow text-center">
      <div class="upgrade-hero-icon" aria-hidden="true">💳</div>
      <div class="modal-title">Checkout closed</div>
      <button type="button" class="btn payment-not-completed-btn" disabled>Payment not completed</button>
      <p class="modal-sub upgrade-legal">The payment gateway did not confirm a charge. You cannot continue the previous attempt — start only a new checkout after acknowledging this.</p>
      <button type="button" class="btn btn-ghost upgrade-full-btn" onclick="acknowledgeIncompletePayment()">Acknowledge — I'll start a new checkout when ready</button>
    </div>`;
    return;
  }
  if(state.billing.lastOutcome==='verify_failed'&&!state.billing.activeCheckout){
    body.innerHTML=`<div class="upgrade-flow text-center">
      <div class="upgrade-hero-icon" aria-hidden="true">🔒</div>
      <div class="modal-title">Verification failed</div>
      <button type="button" class="btn payment-not-completed-btn" disabled>Payment not completed</button>
      <p class="modal-sub upgrade-legal">We could not verify this payment (invalid payload, amount, session, or signature). No plan change was made.</p>
      <button type="button" class="btn btn-ghost upgrade-full-btn" onclick="acknowledgeIncompletePayment()">Acknowledge — return to checkout</button>
    </div>`;
    return;
  }
  const ac=state.billing.activeCheckout;
  if(ac){
    const sid=(ac.sessionId||'').slice(0,8)+'…';
    body.innerHTML=`<div class="upgrade-flow">
      <div class="text-center"><div class="upgrade-hero-icon" aria-hidden="true">🔐</div>
      <div class="modal-title">Secure checkout</div>
      <p class="modal-sub">Session <code class="upgrade-code">${sid}</code> · ₹${(ac.amountPaise/100).toFixed(2)} · completes within ${Math.ceil(CHECKOUT_TTL_MS/60000)} min</p></div>
      <p class="upgrade-hint text-center">Demo: choose an outcome. Production uses Razorpay + server verification only.</p>
      <div class="upgrade-actions-stack">
        <button type="button" class="btn btn-primary upgrade-full-btn" onclick="simulateProPaymentSuccess()">Complete payment (verified)</button>
        <button type="button" class="btn btn-ghost upgrade-full-btn" onclick="cancelProCheckout('user_cancelled')">Cancel checkout</button>
      </div>
    </div>`;
    return;
  }
  body.innerHTML=`<div class="upgrade-flow text-center">
    <div class="upgrade-hero-icon" aria-hidden="true">🚀</div>
    <div class="modal-title">Upgrade to Pro</div>
    <p class="modal-sub">₹99/month · unlimited downloads · all templates · AI Coach · image export</p>
    <ul class="upgrade-mini-list text-left">
      <li>All 25+ premium resume templates</li>
      <li>AI Career Coach & Deep Enhance</li>
      <li>Career GPS mapping</li>
      <li>Unlimited PDF & image downloads</li>
      <li>Priority AI processing speed</li>
    </ul>
    <button type="button" class="btn btn-primary upgrade-full-btn" onclick="startProCheckout()">Continue to secure checkout</button>
    <p class="upgrade-footnote">No Refund · Cancel anytime. ${typeof isStripeConfigured === 'function' && isStripeConfigured() ? 'Real payment processing enabled.' : 'Demo mode — simulated checkout.'}</p>
  </div>`;
}

function updatePricingUI() {
  const isPro = state.plan === 'pro';
  const proCard = document.getElementById('proPricingCard');
  const proBtn = document.getElementById('proPricingBtn');
  
  if (proCard && proBtn) {
    if (isPro) {
      proCard.classList.add('is-pro');
      proBtn.textContent = 'Already Pro ✨';
      proBtn.disabled = true;
      proBtn.onclick = null;
      proBtn.style.opacity = '0.7';
      proBtn.style.cursor = 'default';
    } else {
      proCard.classList.remove('is-pro');
      proBtn.textContent = 'Upgrade to Pro →';
      proBtn.disabled = false;
      proBtn.onclick = openUpgrade;
      proBtn.style.opacity = '1';
      proBtn.style.cursor = 'pointer';
    }
  }
}
function acknowledgeIncompletePayment(){
  state.billing.lastOutcome='idle';
  state.billing.activeCheckout=null;
  saveState();
  renderUpgradeModal();
}
async function startProCheckout(){
  normalizeBillingState();
  if(state.plan==='pro')return;
  if(state.billing.lastOutcome!=='idle')return;
  if(state.billing.activeCheckout)return;

  // Try Stripe Checkout first if configured
  if (typeof startStripeCheckout === 'function' && typeof isStripeConfigured === 'function' && isStripeConfigured()) {
    const started = await startStripeCheckout();
    if (started) return; // Redirecting to Stripe
  }

  // Fall back to demo checkout
  if(!crypto.randomUUID){showToast('❌','Secure checkout requires a modern browser');return;}
  const sessionId=crypto.randomUUID();
  if(!UUID_V4_RE.test(sessionId)){showToast('❌','Invalid session');return;}
  state.billing.activeCheckout={sessionId,amountPaise:PRO_AMOUNT_PAISE,createdAtMs:Date.now()};
  saveState();
  renderUpgradeModal();
}
function cancelProCheckout(reason){
  state.billing.activeCheckout=null;
  state.billing.lastOutcome='cancelled';
  state.billing.lastCancelReason=reason||'cancelled';
  saveState();
  renderUpgradeModal();
}
async function derivePaymentSignature(sessionId,amountPaise){
  const raw=`${sessionId}|${amountPaise}|${PAYMENT_VERIFY_SALT}`;
  if(window.crypto?.subtle){
    const enc=new TextEncoder().encode(raw);
    const buf=await crypto.subtle.digest('SHA-256',enc);
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  let h=2166136261>>>0;
  for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619)>>>0;
  return (h.toString(16)+h.toString(16)+raw.length.toString(16).padStart(8,'0')).padEnd(64,'0').slice(0,64);
}
function isValidHex64(s){return typeof s==='string'&&/^[0-9a-f]{64}$/i.test(s);}
async function verifyProPaymentAndActivate(payload){
  const fail=(code)=>{
    state.billing.activeCheckout=null;
    state.billing.lastOutcome='verify_failed';
    state.billing.lastVerifyFailCode=code;
    saveState();
    renderUpgradeModal();
    showToast('🔒','Payment not verified: '+code);
  };
  if(!payload||typeof payload!=='object'){fail('INVALID_PAYLOAD');return false;}
  const {sessionId,amountPaise,paidAt,signature,gateway}=payload;
  if(typeof sessionId!=='string'||!UUID_V4_RE.test(sessionId)){fail('SESSION_ID');return false;}
  if(typeof amountPaise!=='number'||!Number.isInteger(amountPaise)||amountPaise!==PRO_AMOUNT_PAISE){fail('AMOUNT');return false;}
  if(typeof paidAt!=='number'||!Number.isFinite(paidAt)||Math.abs(Date.now()-paidAt)>120000){fail('TIMESTAMP');return false;}
  if(typeof gateway!=='string'||gateway.length<2||gateway.length>48){fail('GATEWAY');return false;}
  if(!isValidHex64(signature)){fail('SIGNATURE_FORMAT');return false;}
  const ac=state.billing.activeCheckout;
  if(!ac||ac.sessionId!==sessionId||ac.amountPaise!==amountPaise){fail('SESSION_STATE');return false;}
  if(Date.now()-ac.createdAtMs>CHECKOUT_TTL_MS){fail('SESSION_EXPIRED');return false;}
  if(state.billing.consumedSessionIds.includes(sessionId)){fail('SESSION_REUSED');return false;}
  const expected=await derivePaymentSignature(sessionId,amountPaise);
  if(signature.toLowerCase()!==expected.toLowerCase()){fail('SIGNATURE_MISMATCH');return false;}
  state.billing.consumedSessionIds.push(sessionId);
  if(state.billing.consumedSessionIds.length>80)state.billing.consumedSessionIds=state.billing.consumedSessionIds.slice(-80);
  state.billing.activeCheckout=null;
  state.billing.lastOutcome='idle';
  state.plan='pro';
  saveState();
  applyState();
  // Sync to Firestore if connected
  if (typeof updateFirestorePlan === 'function') {
    updateFirestorePlan('pro');
  }
  closeUpgradeModal();
  showToast('⚡','Pro activated after verified payment.');
  return true;
}
async function simulateProPaymentSuccess(){
  const ac=state.billing.activeCheckout;
  if(!ac)return;
  if(Date.now()-ac.createdAtMs>CHECKOUT_TTL_MS){
    state.billing.activeCheckout=null;
    state.billing.lastOutcome='verify_failed';
    saveState();
    renderUpgradeModal();
    showToast('⏱️','Checkout session expired. Start again.');
    return;
  }
  const paidAt=Date.now();
  const signature=await derivePaymentSignature(ac.sessionId,ac.amountPaise);
  await verifyProPaymentAndActivate({
    sessionId:ac.sessionId,
    amountPaise:ac.amountPaise,
    paidAt,
    gateway:'razorpay_sim',
    signature
  });
}

// ═══ THEME ═══
function toggleTheme(){
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveState();
  showToast(state.theme === 'dark' ? '🌙' : '☀️', `${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)} mode enabled`);
}

function applyTheme(){
  const h = document.documentElement;
  h.setAttribute('data-theme', state.theme);
  
  // Update profile toggle
  const toggles = document.querySelectorAll('.drag-toggle#themeToggle');
  toggles.forEach(toggle => {
    if(state.theme === 'dark') toggle.classList.add('on');
    else toggle.classList.remove('on');
  });

  // Ensure body has transition class after initial load
  if (!document.body.classList.contains('theme-transition')) {
    setTimeout(() => document.body.classList.add('theme-transition'), 100);
  }
}

function setProfilePhotoStyle(style){
  state.user.photoStyle = style;
  saveState();
  renderProfile();
  showToast('👤', 'Profile style updated!');
}

function renderProfile(){
  const nameEl = document.getElementById('profile-name-display');
  const emailEl = document.getElementById('profile-email-display');
  const avatarEl = document.getElementById('profile-avatar-display');
  const planChip = document.getElementById('profilePlanChip');
  
  if(nameEl) nameEl.textContent = state.user.name;
  if(emailEl) emailEl.textContent = state.user.email;
  
  // Update plan badge
  if(planChip) {
    const isPro = state.plan === 'pro';
    planChip.textContent = isPro ? 'Pro Plan' : 'Free Plan';
    planChip.className = 'plan-chip ' + (isPro ? 'pro' : 'free');
  }
  
  if(avatarEl) {
    const styles = {
      style1: 'linear-gradient(135deg, #22c55e, #16a34a)',
      style2: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      style3: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      style4: 'linear-gradient(135deg, #ec4899, #db2777)',
      style5: 'linear-gradient(135deg, #f59e0b, #d97706)',
      style6: 'linear-gradient(135deg, #10b981, #059669)',
      style7: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      style8: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      style9: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      style10: 'linear-gradient(135deg, #84cc16, #65a30d)'
    };
    avatarEl.style.background = styles[state.user.photoStyle] || styles.style1;
    avatarEl.textContent = state.user.initials;
  }

  // Show/hide sign out button
  const signOutRow = document.getElementById('signOutRow');
  if (signOutRow) {
    signOutRow.style.display = isAuthenticated() ? 'flex' : 'none';
  }
}

// ═══ SUBSCRIPTION UI SYNC ═══
function updateSubscriptionUI() {
  const isPro = state.plan === 'pro';
  
  // Profile subscription box
  const subBox = document.getElementById('subscriptionBox');
  const subLabel = document.getElementById('subPlanLabel');
  const subDesc = document.getElementById('subPlanDesc');
  const subBtn = document.getElementById('subActionBtn');
  const featuresMini = document.getElementById('subFeaturesMini');

  if (subBox) {
    subBox.classList.toggle('is-pro', isPro);
  }
  if (subLabel) {
    subLabel.textContent = isPro ? '⚡ Pro Plan' : 'Free Plan';
  }
  if (subDesc) {
    subDesc.textContent = isPro ? 'All tools unlocked · Premium templates · Priority AI' : 'Limited tools · Basic templates';
  }
  
  // Dashboard toolbar Upgrade button
  const dashUpgradeBtn = document.getElementById('dashUpgradeBtn');
  if (dashUpgradeBtn) {
    dashUpgradeBtn.style.display = isPro ? 'none' : 'block';
  }
  if (subBtn) {
    if (isPro) {
      subBtn.textContent = '✅ Active';
      subBtn.classList.remove('btn-primary');
      subBtn.classList.add('btn-ghost');
      subBtn.onclick = () => showToast('✅', 'You are on the Pro plan!');
    } else {
      subBtn.textContent = '✨ Upgrade to Pro';
      subBtn.classList.remove('btn-ghost');
      subBtn.classList.add('btn-primary');
      subBtn.onclick = openUpgrade;
    }
  }
  if (featuresMini) {
    if (isPro) {
      featuresMini.innerHTML = `
        <div class="sub-feat"><span class="sub-feat-icon">📄</span> All 25+ Templates</div>
        <div class="sub-feat"><span class="sub-feat-icon">📥</span> Unlimited Downloads</div>
        <div class="sub-feat"><span class="sub-feat-icon">🤖</span> AI Coach ✅</div>
        <div class="sub-feat"><span class="sub-feat-icon">🖼️</span> Image Export ✅</div>
      `;
    } else {
      featuresMini.innerHTML = `
        <div class="sub-feat"><span class="sub-feat-icon">📄</span> 5 Resume Templates</div>
        <div class="sub-feat"><span class="sub-feat-icon">📥</span> 2 PDF Downloads</div>
        <div class="sub-feat locked"><span class="sub-feat-icon">🤖</span> AI Coach <span class="plan-chip pro" style="font-size:.6rem;padding:.1rem .4rem;">PRO</span></div>
        <div class="sub-feat locked"><span class="sub-feat-icon">🖼️</span> Image Export <span class="plan-chip pro" style="font-size:.6rem;padding:.1rem .4rem;">PRO</span></div>
      `;
    }
  }

  // Sidebar plan display
  const sidebarPlan = document.getElementById('sidebarUserPlan');
  if (sidebarPlan) {
    sidebarPlan.textContent = isPro ? 'Pro Plan' : 'Free Plan';
  }

  // Mark PRO-only sidebar items
  PRO_ONLY_SECTIONS.forEach(section => {
    const item = document.querySelector(`.sidebar-item[data-section="${section}"]`);
    if (item) {
      if (!isPro && !item.querySelector('.pro-lock-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pro-lock-badge';
        badge.textContent = '🔒';
        badge.style.cssText = 'font-size:0.6rem;margin-left:auto;opacity:.6;';
        item.appendChild(badge);
      } else if (isPro) {
        const badge = item.querySelector('.pro-lock-badge');
        if (badge) badge.remove();
      }
    }
  });
}

// ═══ SIGN OUT ═══
async function handleSignOut() {
  // Try Firebase sign-out first
  if (typeof firebaseSignOut === 'function' && typeof isFirebaseConfigured === 'function' && isFirebaseConfigured()) {
    await firebaseSignOut();
  } else {
    // Local sign-out
    state.auth = { provider: null, guestStartedAt: null, lastActivityAt: null };
    state.user = { name: 'Guest User', email: 'guest@careerpilot.ai', initials: 'G' };
    state.plan = 'free';
    saveState();
    applyAuthUI();
    enforceLandingOnly();
    showToast('👋', 'Signed out successfully');
  }
}

function openReviewModal(){
  if(!isAuthenticated()){openAuth();return;}
  openModal('reviewModal');
}
function submitReview(){
  const stars = document.getElementById('rev-stars').value;
  const text = document.getElementById('rev-text').value;
  if(!text.trim()){showToast('⚠️','Please enter your review');return;}
  showToast('🌟','Thank you for your feedback!');
  closeModal('reviewModal');
}

// ═══ TOAST ═══
let toastTimer;
function showToast(icon,msg){const t=document.getElementById('toast');document.getElementById('toastIcon').textContent=icon;document.getElementById('toastMsg').textContent=msg;  t.style.display='flex';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.style.display='none',6000);
}

// ═══ RENDER GRIDS ═══
function renderFeatureGrid() {
  const grid = document.getElementById('featGrid');
  if (!grid) return;
  grid.innerHTML = FEATURES.map(f => `
    <div class="feat-card card-3d" onclick="requestDashboardTool('${f.section}')">
      <div class="feat-icon">${f.icon}</div>
      <div class="feat-name">${f.name}</div>
      <div class="feat-desc">${f.desc}</div>
      <div class="feat-tag ${f.tagCls}">${f.tag}</div>
    </div>
  `).join('');
}

// ═══ TEMPLATE PICKER ═══
function renderTemplates(filterCat = 'all'){
  const p=document.getElementById('tplPicker');
  if(!p) return;
  
  const colors={
    minimal:'#111',modern:'#16a34a',creative:'#111',corporate:'#1a365d',
    fresher:'#0f172a',tech:'#0ea5e9',executive:'#78350f',designer:'#ec4899',
    academic:'#1e40af',startup:'#7c3aed',elegant:'#374151',bold:'#dc2626',
    infographic:'#06b6d4',professional:'#334155',compact:'#0d9488',
    'google-blue':'#4285F4','google-grey':'#5f6368','silicon-valley':'#1a73e8',
    'tokyo-nights':'#7aa2f7','premium-gold':'#d4af37','minimal-blue':'#3b82f6',
    'creative-dark':'#9333ea','executive-pro':'#0f172a','startup-bold':'#7c3aed',
    'academic-classic':'#1e3a5f',
    'kara-elegant':'#c9a96e','nadia-framed':'#333','chris-purple':'#8b5cf6',
    'michael-modern':'#2563eb','yellow-bold':'#eab308','nordic-clean':'#94a3b8',
    'coral-creative':'#f97316','midnight-pro':'#14b8a6',
    'classic-serif':'#4a5568','two-column':'#0891b2'
  };

  const filtered = filterCat === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === filterCat);

  p.innerHTML=filtered.map(t=>{
    const c=colors[t.id]||'#333';const locked=!t.free&&state.plan==='free';
    const isActive = t.id===state.currentTemplate;
    return `<div class="tpl-card ${isActive?'active':''} ${locked?'locked':''}" data-tpl="${t.id}" onclick="selectTemplate('${t.id}',this)">
      <div class="tpl-thumb" style="background:#fff;border:1px solid #eee;">
        <div style="height:8px;background:${c};border-radius:1px;margin-bottom:2px;"></div>
        <div style="height:2px;background:${c};margin-bottom:3px;opacity:.3;"></div>
        <div style="height:2px;background:#ddd;margin-bottom:1px;width:80%"></div>
        <div style="height:2px;background:#ddd;margin-bottom:1px;width:90%"></div>
        <div style="height:3px;background:${c};border-radius:1px;width:40%;margin-bottom:1px;opacity:.5;"></div>
        <div style="height:2px;background:#ddd;width:70%"></div>
      </div>
      <div class="tpl-label">${t.name}</div>
    </div>`;
  }).join('');

  // After rendering, if there's an active template, scroll to it
  setTimeout(() => {
    const active = p.querySelector('.tpl-card.active');
    if(active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 100);
}

function filterTemplates(cat, btn) {
  const tabs = document.querySelectorAll('.cat-btn');
  tabs.forEach(t => t.classList.remove('active'));
  if(btn) btn.classList.add('active');

  const picker = document.getElementById('tplPicker');
  if(picker) {
    picker.style.opacity = '0.4';
    setTimeout(() => {
      renderTemplates(cat);
      picker.style.opacity = '1';
    }, 150);
  }
}

function scrollCarousel(dir) {
  const p = document.getElementById('tplPicker');
  if(!p) return;
  const scrollAmount = p.offsetWidth * 0.7;
  p.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
}

function selectTemplate(tpl,el){
  if(!isAuthenticated()){openAuth();return;}
  const t=TEMPLATES.find(x=>x.id===tpl);
  if(!t.free&&state.plan==='free'){
    openUpgrade();
    showToast('🔒','This template requires a Pro plan');
    return;
  }
  state.currentTemplate=tpl;
  document.querySelectorAll('.tpl-card').forEach(o=>o.classList.remove('active'));
  if(el) {
    el.classList.add('active');
    // Centering logic optimized for smaller 110px cards
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  saveState();
  if(state.resumeGenerated)renderResume();
  else showToast('🎨','Template selected: '+t.name);
}

// ═══ FORM TABS ═══
function switchFormTab(name,btn){
  document.querySelectorAll('.form-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('fs-'+name)?.classList.add('active');
  document.querySelectorAll('.section-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
}

// ═══ DRAG & DROP SECTION ORDER ═══
function renderSectionOrder(){
  const list=document.getElementById('sectionOrderList');
  list.innerHTML=state.sectionOrder.map(s=>{
    const vis=state.sectionVisibility[s]!==false;
    const labels={summary:'Summary',experience:'Experience',education:'Education',skills:'Skills',projects:'Projects',certifications:'Certifications',achievements:'Achievements',languages:'Languages'};
    return `<div class="drag-section" draggable="true" data-section="${s}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="drop(event)" ondragend="dragEnd(event)">
      <span class="drag-handle">⠿</span> ${labels[s]||s}
      <button class="drag-toggle ${vis?'on':''}" onclick="toggleSection('${s}',this)"></button>
    </div>`;
  }).join('');
}
let dragItem=null;
function dragStart(e){dragItem=e.target;e.target.classList.add('dragging');e.dataTransfer.effectAllowed='move';}
function dragOver(e){e.preventDefault();const target=e.target.closest('.drag-section');if(target&&target!==dragItem){const list=document.getElementById('sectionOrderList');const items=[...list.children];const dragIdx=items.indexOf(dragItem);const targetIdx=items.indexOf(target);if(dragIdx<targetIdx)target.after(dragItem);else target.before(dragItem);}}
function drop(e){e.preventDefault();updateSectionOrder();}
function dragEnd(e){e.target.classList.remove('dragging');dragItem=null;updateSectionOrder();}
function updateSectionOrder(){const items=document.getElementById('sectionOrderList').querySelectorAll('.drag-section');state.sectionOrder=[...items].map(i=>i.dataset.section);saveState();if(state.resumeGenerated)renderResume();}
function toggleSection(s,btn){state.sectionVisibility[s]=!state.sectionVisibility[s];btn.classList.toggle('on');saveState();if(state.resumeGenerated)renderResume();}

// ═══ CUSTOMIZATION ═══
function setPhotoSize(v){state.resumePhotoSize=parseInt(v);saveState();if(state.resumeGenerated)renderResume();}
function setPhotoShape(v){state.resumePhotoShape=v;saveState();if(state.resumeGenerated)renderResume();}
function handlePhotoUpload(input){
  if(input.files && input.files[0]){
    const reader = new FileReader();
    reader.onload = function(e){
      state.resumePhoto = e.target.result;
      state.showResumePhoto = true; // Auto-enable when uploaded
      
      const photoImg = document.getElementById('photoImg');
      const photoPlaceholder = document.getElementById('photoPlaceholder');
      const photoToggle = document.getElementById('photoToggle');
      
      if(photoImg) {
        photoImg.src = e.target.result;
        photoImg.style.display = 'block';
      }
      if(photoPlaceholder) photoPlaceholder.style.display = 'none';
      if(photoToggle) photoToggle.classList.add('on');
      
      saveState();
      if(state.resumeGenerated) renderResume();
    };
    reader.readAsDataURL(input.files[0]);
  }
}
function togglePhoto(btn){
  state.showResumePhoto = !state.showResumePhoto;
  btn.classList.toggle('on', state.showResumePhoto);
  saveState();
  if(state.resumeGenerated) renderResume();
}
function setResumeColor(el){document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');const c=el.dataset.color;if(c!=='custom')state.resumeColor=c;saveState();if(state.resumeGenerated)renderResume();}
function setCustomColor(c){state.resumeColor=c;saveState();if(state.resumeGenerated)renderResume();}
function setResumeFont(f){state.resumeFont=f;saveState();if(state.resumeGenerated)renderResume();}
function setResumeSpacing(v){state.resumeSpacing=parseFloat(v);saveState();if(state.resumeGenerated)renderResume();}

// ═══ RESUME GENERATION ═══
function v(id){return(document.getElementById(id)?.value||'').trim();}
function liveUpdate(){if(state.resumeGenerated||v('rv-name')||v('rv-role'))renderResume();calculateScore();}
function fillFakeResumeData() {
  const data = {
    'rv-name': 'Alex Rivera',
    'rv-role': 'Senior Software Engineer',
    'rv-email': 'alex.rivera@example.com',
    'rv-phone': '+1 (555) 123-4567',
    'rv-location': 'San Francisco, CA',
    'rv-linkedin': 'linkedin.com/in/alexrivera',
    'rv-summary': 'Innovative Senior Software Engineer with 6+ years of experience in architecting scalable web applications. Proven track record in leading high-performing teams, optimizing backend systems, and delivering features that drive 40% user engagement growth. Passionate about clean code, cloud architecture, and mentoring junior developers.',
    'rv-experience': 'Senior Software Engineer · TechNova Solutions · 2020–Present\n• Architected a microservices-based backend handling 5M+ daily requests\n• Mentored a team of 4 junior developers and established CI/CD best practices\n• Reduced database query latency by 65% through caching optimization\n\nSoftware Developer · InnovateX · 2018–2020\n• Built modern RESTful APIs using Node.js and Express\n• Integrated payment gateways processing $2M+ in monthly transactions\n• Spearheaded the migration from an old monolithic legacy system to React frontend',
    'rv-degree': 'B.S. in Computer Science',
    'rv-institution': 'University of California, Berkeley',
    'rv-year': '2018',
    'rv-gpa': '3.8 / 4.0',
    'rv-edu2': 'Minor in Data Science · UCB · 2018',
    'rv-skills': 'JavaScript, TypeScript, React.js, Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL',
    'rv-softskills': 'Agile Leadership, Technical Mentorship, System Architecture, Cross-functional Communication',
    'rv-languages': 'English (Native), Spanish (Fluent)',
    'rv-projects': 'Real-Time Collaboration Platform · React, WebSockets, Redis\n• Built a low-latency document collaboration tool supporting 50+ concurrent users per room\n• Implemented Operational Transformation algorithms for conflict resolution\n\nAI Resume Analyzer · Python, OpenAI API\n• Developed a script to parse resumes and score them against job descriptions with 95% accuracy',
    'rv-certs': 'AWS Certified Solutions Architect – Associate · 2022\nCertified Kubernetes Administrator (CKA) · 2021',
    'rv-achievements': 'Awarded "Engineer of the Year" at TechNova (2022)\nWinner, Global Hackathon San Francisco (2019)'
  };
  Object.entries(data).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  showToast('✨', 'Resume filled with demo data!');
  if (!state.resumeGenerated) generateResume();
  else liveUpdate();
}

function generateResume(){
  if(!isAuthenticated()){openAuth();return;}
  if(!v('rv-name')||!v('rv-role')){showToast('⚠️','Please fill Name and Target Role');return;}
  state.resumeGenerated=true;renderResume();calculateScore();
  const dl=document.getElementById('dlPDF');dl.disabled=false;dl.style.opacity='1';
  const di=document.getElementById('dlImg');di.disabled=false;di.style.opacity='1';
  state.stats.resumes++;
  if(document.getElementById('statResumes')) document.getElementById('statResumes').textContent=state.stats.resumes;
  state.profileStrength=Math.min(100,state.profileStrength+15);
  if(document.getElementById('strengthPct')) document.getElementById('strengthPct').textContent=state.profileStrength+'%';
  if(document.getElementById('strengthBar')) document.getElementById('strengthBar').style.width=state.profileStrength+'%';
  // Auto-save to Document Hub
  const resumeName = `${v('rv-name')||'Resume'} — ${state.currentTemplate} — ${new Date().toLocaleDateString()}`;
  saveToDocHub(resumeName, 'Resume', `Template: ${state.currentTemplate}`);
  saveState();showToast('✅','Resume generated & saved to Document Hub!');
}

function renderResume(){
  const d={name:v('rv-name')||'Your Name',role:v('rv-role')||'Target Role',email:v('rv-email')||'email@example.com',phone:v('rv-phone')||'+91 00000 00000',location:v('rv-location')||'City, India',linkedin:v('rv-linkedin')||'',summary:v('rv-summary')||'',experience:v('rv-experience')||'',degree:v('rv-degree')||'',institution:v('rv-institution')||'',year:v('rv-year')||'',gpa:v('rv-gpa')||'',edu2:v('rv-edu2')||'',skills:v('rv-skills')||'',softskills:v('rv-softskills')||'',languages:v('rv-languages')||'',projects:v('rv-projects')||'',certs:v('rv-certs')||'',achievements:v('rv-achievements')||''};
  const C=state.resumeColor;const F=state.resumeFont;const SP=state.resumeSpacing;
  const tpl=state.currentTemplate;

  function bullets(text){
    if(!text)return'';
    return text.split('\n').filter(l=>l.trim()).map(line=>{
      if(/^[•\-\*]/.test(line))return`<div class="rv-bullet">${line.replace(/^[•\-\*]\s*/,'')}</div>`;
      return`<div style="font-weight:700;font-size:9px;color:#333;margin-top:4px;">${line}</div>`;
    }).join('');
  }
  function chips(s,bg='#f0f0f0',tc='#333'){return s.split(',').filter(x=>x.trim()).map(x=>`<span class="rv-skill" style="background:${bg};color:${tc};">${x.trim()}</span>`).join('');}
  function skillDots(s,color='#eab308'){return s.split(',').filter(x=>x.trim()).slice(0,6).map((sk,i)=>`<div style="margin-bottom:6px;"><div style="font-size:7.5px;color:#555;margin-bottom:2px;">${sk.trim()}</div><div style="display:flex;gap:3px;">${[1,2,3,4,5].map(n=>`<div style="width:6px;height:6px;border-radius:50%;background:${n<=(5-i)?color:'#ddd'};"></div>`).join('')}</div></div>`).join('');}

  const sectionRenderers={
    summary:()=>d.summary?`<div style="font-size:8.5px;color:#444;line-height:${SP+.1};margin-bottom:10px;">${d.summary}</div>`:'',
    experience:()=>d.experience?`<div class="rv-section" style="color:${C};">Experience</div>${bullets(d.experience)}`:'',
    education:()=>d.degree?`<div class="rv-section" style="color:${C};">Education</div><div class="rv-item-title">${d.degree}${d.institution?' · '+d.institution:''}</div><div class="rv-item-sub">${[d.year,d.gpa?'GPA: '+d.gpa:''].filter(Boolean).join(' · ')}</div>${d.edu2?`<div style="margin-top:3px;font-size:8px;color:#555;">${d.edu2}</div>`:''}`:'',
    skills:()=>d.skills?`<div class="rv-section" style="color:${C};">Skills</div><div>${chips(d.skills)}</div>${d.softskills?'<div style="margin-top:4px;">'+chips(d.softskills,'#e8f5e9','#166534')+'</div>':''}`:'' ,
    projects:()=>d.projects?`<div class="rv-section" style="color:${C};">Projects</div>${bullets(d.projects)}`:'',
    certifications:()=>d.certs?`<div class="rv-section" style="color:${C};">Certifications</div>${bullets(d.certs)}`:'',
    achievements:()=>d.achievements?`<div class="rv-section" style="color:${C};">Achievements</div>${bullets(d.achievements)}`:'',
    languages:()=>d.languages?`<div class="rv-section" style="color:${C};">Languages</div><div style="font-size:8.5px;">${d.languages}</div>`:''
  };

  let body=state.sectionOrder.filter(s=>state.sectionVisibility[s]!==false).map(s=>`<div class="rv-section-block" data-section="${s}">${(sectionRenderers[s]||(()=> ''))()}</div>`).join('');
  let html='';

  const ps = state.resumePhotoSize || 52;
  const pr = state.resumePhotoShape === 'circle' ? '50%' : state.resumePhotoShape === 'rounded' ? '8px' : '0';
  const hasPhoto = !!(state.showResumePhoto && state.resumePhoto);
  const photoHTML = hasPhoto
    ? `<img src="${state.resumePhoto}" style="width:${ps}px;height:${ps}px;border-radius:${pr};object-fit:cover;border:2px solid ${C};flex-shrink:0;"/>`
    : `<div style="width:${ps}px;height:${ps}px;border-radius:${pr};background:linear-gradient(135deg,${C}22,${C}44);display:flex;align-items:center;justify-content:center;font-size:${ps*0.4}px;color:${C};font-weight:800;flex-shrink:0;border:2px solid ${C}22;">${d.name.charAt(0)}</div>`;
  const headerFlex = 'display:flex;align-items:center;gap:12px;';

  if(tpl==='modern'||tpl==='tech'||tpl==='startup'||tpl==='bold'){
    html=`<div class="rv" style="padding:0;font-family:${F};line-height:${SP};">
      <div style="background:${tpl==='bold'?C:tpl==='tech'?'linear-gradient(135deg,#0f172a,#1e293b)':`linear-gradient(135deg,${C},${C}dd)`};color:#fff;padding:22px 28px;">
        <div style="${headerFlex}">
          ${photoHTML.replace(`border:2px solid ${C}`, 'border:2px solid rgba(255,255,255,.5)')}
          <div>
            <div class="rv-name" style="color:#fff;">${d.name}</div>
            <div style="font-size:10px;opacity:.85;margin-top:2px;">${d.role}</div>
          </div>
        </div>
        <div class="rv-contact" style="color:rgba(255,255,255,.85);margin-top:8px;margin-bottom:0;">${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).map(x=>`<span>${x}</span>`).join('')}</div>
      </div>
      <div style="padding:18px 28px;">${body}</div>
    </div>`;
  } else if(tpl==='creative'||tpl==='designer'||tpl==='infographic'){
    const sk=d.skills.split(',').filter(s=>s.trim()).slice(0,6).map((s,i)=>`<div style="margin-bottom:4px;"><div style="font-size:7.5px;color:#ddd;margin-bottom:1px;">${s.trim()}</div><div style="height:3px;background:#333;border-radius:2px;"><div style="height:100%;width:${90-i*8}%;background:${C};border-radius:2px;"></div></div></div>`).join('');
    const sbg = tpl==='designer'?'#1a1a2e':tpl==='infographic'?'#0c1222':'#111';
    html=`<div class="rv" style="display:grid;grid-template-columns:38% 62%;padding:0;font-family:${F};line-height:${SP};">
      <div style="background:${sbg};color:#fff;padding:22px 16px;">
        <div style="text-align:center;margin-bottom:10px;">${photoHTML.replace(`width:${ps}px;height:${ps}px`,`width:60px;height:60px`).replace(`border:2px solid ${C}`, `border:2px solid ${C}`)}</div>
        <div class="rv-name" style="font-size:15px;color:#fff;">${d.name}</div>
        <div style="font-size:8px;color:${C};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${d.role}</div>
        ${d.email?`<div style="font-size:7.5px;color:#aaa;margin-bottom:3px;">✉ ${d.email}</div>`:''}
        ${d.phone?`<div style="font-size:7.5px;color:#aaa;margin-bottom:3px;">☎ ${d.phone}</div>`:''}
        ${d.location?`<div style="font-size:7.5px;color:#aaa;margin-bottom:3px;">📍 ${d.location}</div>`:''}
        ${d.skills?`<div style="font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${C};margin:12px 0 6px;">Skills</div>${sk}`:''}
        ${d.languages?`<div style="font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${C};margin:12px 0 6px;">Languages</div><div style="font-size:7.5px;color:#bbb;">${d.languages}</div>`:''}
      </div>
      <div style="padding:22px 18px;">${body}</div>
    </div>`;
  } else if(tpl==='fresher'||tpl==='academic'){
    html=`<div class="rv" style="padding:0;font-family:${F};line-height:${SP};">
      <div style="background:${tpl==='academic'?'#1e3a5f':'#0f172a'};padding:18px 28px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="${headerFlex}">
          ${photoHTML.replace(`border:2px solid ${C}`, 'border:2px solid rgba(255,255,255,.4)')}
          <div><div class="rv-name" style="color:#fff;font-size:18px;">${d.name}</div><div style="font-size:9px;color:${C};margin-top:2px;">${d.role}</div>
          <div style="display:flex;gap:10px;margin-top:6px;">${[d.email,d.phone,d.location].filter(Boolean).map(x=>`<span style="font-size:7px;color:#94a3b8;">${x}</span>`).join('')}</div></div>
        </div>
        ${d.degree?`<div style="text-align:right;"><div style="font-size:7px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Education</div><div style="font-size:9px;color:#fff;font-weight:700;margin-top:2px;">${d.degree}</div><div style="font-size:8px;color:#94a3b8;">${d.institution}</div>${d.gpa?`<div style="font-size:9px;font-weight:700;color:${C};">${d.gpa}</div>`:''}</div>`:''}
      </div>
      <div style="padding:18px 28px;">${body}</div>
    </div>`;
  } else if(tpl==='corporate'||tpl==='executive'||tpl==='elegant'||tpl==='professional'){
    const ff=tpl==='corporate'?"'Times New Roman',serif":tpl==='professional'?"'Helvetica',sans-serif":F;
    const hc=tpl==='executive'?'#78350f':tpl==='elegant'?'#374151':tpl==='professional'?'#334155':C;
    html=`<div class="rv" style="font-family:${ff};line-height:${SP};">
      <div style="${headerFlex}">
        ${photoHTML}
        <div>
          <div class="rv-name" style="color:${hc};font-size:20px;">${d.name}</div>
          ${d.role?`<div style="font-size:9px;color:${hc};opacity:.7;margin-bottom:4px;">${d.role}</div>`:''}
        </div>
      </div>
      <div style="text-align:center;font-size:8px;color:#555;margin-bottom:10px;">${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).join(' | ')}</div>
      <div style="height:1.5px;background:${hc};margin-bottom:12px;"></div>
      ${body}
    </div>`;
  } else if(tpl==='compact'){
    html=`<div class="rv" style="padding:16px 20px;font-family:${F};line-height:${SP*0.9};font-size:8.5px;">
      <div style="${headerFlex}margin-bottom:8px;">
        ${photoHTML.replace(`width:${ps}px;height:${ps}px`,'width:36px;height:36px')}
        <div style="flex:1;">
          <div class="rv-name" style="color:${C};font-size:16px;margin-bottom:1px;">${d.name}</div>
          <div style="font-size:8px;color:#666;">${[d.role,d.email,d.phone,d.location].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div style="height:1px;background:${C};opacity:.3;margin-bottom:8px;"></div>
      ${body}
    </div>`;
  } else if(tpl==='google-blue'||tpl==='google-grey'||tpl==='silicon-valley'||tpl==='tokyo-nights'||tpl==='premium-gold'){
    const mainColor = tpl==='google-blue'?'#4285F4':tpl==='google-grey'?'#5f6368':tpl==='tokyo-nights'?'#7aa2f7':tpl==='premium-gold'?'#d4af37':'#1a73e8';
    const bgColor = tpl==='tokyo-nights'?'#1a1b26':'#ffffff';
    const textColor = tpl==='tokyo-nights'?'#c0caf5':'#3c4043';
    
    html=`<div class="rv" style="padding:40px; font-family:'Roboto', sans-serif; background:${bgColor}; color:${textColor}; line-height:${SP};">
      <div style="border-left: 4px solid ${mainColor}; padding-left: 20px; margin-bottom: 30px;">
        <div style="${headerFlex}">
          ${photoHTML}
          <div>
            <div class="rv-name" style="font-size: 28px; color: ${mainColor}; font-weight: 500; margin-bottom: 5px;">${d.name}</div>
            <div style="font-size: 14px; font-weight: 500; color: ${tpl==='tokyo-nights'?'#7dcfff':'#70757a'}; margin-bottom: 10px;">${d.role}</div>
            <div class="rv-contact" style="font-size: 11px; display: flex; gap: 15px; flex-wrap: wrap;">
              ${[d.email?`<span>📧 ${d.email}</span>`:'', d.phone?`<span>📱 ${d.phone}</span>`:'', d.location?`<span>📍 ${d.location}</span>`:'', d.linkedin?`<span>🔗 ${d.linkedin}</span>`:''].filter(Boolean).join('')}
            </div>
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        ${body}
      </div>
    </div>`;

  // ═══ NEW TEMPLATES ═══

  } else if(tpl==='kara-elegant'){
    html=`<div class="rv" style="font-family:'Georgia',serif;line-height:${SP};padding:0;">
      <div style="background:#f5f0e8;padding:28px 32px 20px;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:8px;">
          ${photoHTML.replace(`border:2px solid ${C}`,'border:2px solid #c9a96e')}
          <div>
            <div class="rv-name" style="color:#333;font-size:22px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">${d.name}</div>
            <div style="font-size:9px;color:#8a7a5e;text-transform:uppercase;letter-spacing:3px;margin-top:4px;">${d.role}</div>
          </div>
        </div>
        <div style="height:1px;background:#c9a96e;margin:12px 60px 0;"></div>
      </div>
      <div style="padding:20px 32px;">
        <div style="text-align:center;font-size:8px;color:#777;margin-bottom:14px;">${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).join('  •  ')}</div>
        ${body}
      </div>
    </div>`;

  } else if(tpl==='nadia-framed'){
    html=`<div class="rv" style="font-family:'Helvetica',sans-serif;line-height:${SP};padding:0;border:3px solid #222;">
      <div style="padding:28px 28px 18px;display:grid;grid-template-columns:100px 1fr;gap:20px;align-items:start;">
        <div style="text-align:center;">
          ${photoHTML.replace(`width:${ps}px;height:${ps}px`,'width:90px;height:90px').replace(`border:2px solid ${C}`,'border:2px solid #333')}
        </div>
        <div>
          <div class="rv-name" style="color:#222;font-size:24px;font-weight:400;letter-spacing:1px;">${d.name}</div>
          <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-top:4px;margin-bottom:12px;">${d.role}</div>
          <div style="height:1px;background:#ccc;margin-bottom:10px;"></div>
          <div style="font-size:8px;color:#555;display:flex;gap:14px;flex-wrap:wrap;">
            ${d.email?`<span>✉ ${d.email}</span>`:''}${d.phone?`<span>☎ ${d.phone}</span>`:''}${d.location?`<span>📍 ${d.location}</span>`:''}
          </div>
        </div>
      </div>
      <div style="padding:0 28px 24px;">${body}</div>
    </div>`;

  } else if(tpl==='chris-purple'){
    const purpleBg='#e8dff5';const purpleAccent='#7c3aed';
    html=`<div class="rv" style="display:grid;grid-template-columns:35% 65%;padding:0;font-family:${F};line-height:${SP};">
      <div style="background:${purpleBg};padding:24px 16px;">
        <div style="text-align:center;margin-bottom:14px;">${photoHTML.replace(`width:${ps}px;height:${ps}px`,'width:56px;height:56px').replace(`border:2px solid ${C}`,`border:2px solid ${purpleAccent}`)}</div>
        <div class="rv-name" style="font-size:16px;color:#333;">${d.name}</div>
        <div style="font-size:8px;color:${purpleAccent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${d.role}</div>
        ${d.email?`<div style="font-size:7.5px;color:#555;margin-bottom:3px;">✉ ${d.email}</div>`:''}
        ${d.phone?`<div style="font-size:7.5px;color:#555;margin-bottom:3px;">☎ ${d.phone}</div>`:''}
        ${d.location?`<div style="font-size:7.5px;color:#555;margin-bottom:3px;">📍 ${d.location}</div>`:''}
        ${d.skills?`<div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${purpleAccent};margin:14px 0 6px;">Skills</div>${chips(d.skills,purpleAccent+'22',purpleAccent)}`:''}
        ${d.languages?`<div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${purpleAccent};margin:12px 0 6px;">Languages</div><div style="font-size:7.5px;color:#555;">${d.languages}</div>`:''}
      </div>
      <div style="padding:24px 20px;background:#fff;">${body}</div>
    </div>`;

  } else if(tpl==='michael-modern'){
    const blueAccent='#2563eb';
    html=`<div class="rv" style="display:grid;grid-template-columns:35% 65%;padding:0;font-family:'Helvetica',sans-serif;line-height:${SP};">
      <div style="background:#f8fafc;padding:24px 16px;border-right:2px solid #e2e8f0;">
        <div style="text-align:center;margin-bottom:14px;">${photoHTML.replace(`width:${ps}px;height:${ps}px`,'width:72px;height:72px').replace(`border:2px solid ${C}`,`border:2px solid ${blueAccent}`)}</div>
        <div class="rv-name" style="font-size:16px;color:#1e293b;text-align:center;">${d.name}</div>
        <div style="font-size:8px;color:${blueAccent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;text-align:center;">${d.role}</div>
        <div style="height:1px;background:#e2e8f0;margin:10px 0;"></div>
        <div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${blueAccent};margin-bottom:8px;">Contact</div>
        ${d.email?`<div style="font-size:7.5px;color:#475569;margin-bottom:4px;display:flex;align-items:center;gap:4px;"><span style="color:${blueAccent};">✉</span> ${d.email}</div>`:''}
        ${d.phone?`<div style="font-size:7.5px;color:#475569;margin-bottom:4px;display:flex;align-items:center;gap:4px;"><span style="color:${blueAccent};">☎</span> ${d.phone}</div>`:''}
        ${d.location?`<div style="font-size:7.5px;color:#475569;margin-bottom:4px;display:flex;align-items:center;gap:4px;"><span style="color:${blueAccent};">📍</span> ${d.location}</div>`:''}
        ${d.linkedin?`<div style="font-size:7.5px;color:#475569;margin-bottom:4px;display:flex;align-items:center;gap:4px;"><span style="color:${blueAccent};">🔗</span> ${d.linkedin}</div>`:''}
        <div style="height:1px;background:#e2e8f0;margin:10px 0;"></div>
        ${d.skills?`<div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${blueAccent};margin-bottom:8px;">Skills</div>${chips(d.skills,blueAccent+'18',blueAccent)}`:''}
        ${d.languages?`<div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${blueAccent};margin:12px 0 6px;">Languages</div><div style="font-size:7.5px;color:#475569;">${d.languages}</div>`:''}
      </div>
      <div style="padding:24px 22px;background:#fff;">${body}</div>
    </div>`;

  } else if(tpl==='yellow-bold'){
    const yellowColor='#eab308';const darkBg='#1a1a1a';
    html=`<div class="rv" style="display:grid;grid-template-columns:38% 62%;padding:0;font-family:'Helvetica',sans-serif;line-height:${SP};">
      <div style="background:${yellowColor};padding:24px 16px;">
        <div style="text-align:center;margin-bottom:14px;">${photoHTML.replace(`width:${ps}px;height:${ps}px`,'width:80px;height:80px').replace(`border:2px solid ${C}`,`border:3px solid ${darkBg}`)}</div>
        <div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${darkBg};margin:16px 0 8px;border-bottom:2px solid ${darkBg};padding-bottom:4px;">Profile</div>
        <div style="font-size:7.5px;color:#333;line-height:1.5;text-align:justify;">${d.summary||'Results-oriented professional with proven track record.'}</div>
        <div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${darkBg};margin:14px 0 8px;border-bottom:2px solid ${darkBg};padding-bottom:4px;">Contact</div>
        ${d.email?`<div style="font-size:7.5px;color:#333;margin-bottom:3px;">✉ ${d.email}</div>`:''}
        ${d.phone?`<div style="font-size:7.5px;color:#333;margin-bottom:3px;">☎ ${d.phone}</div>`:''}
        ${d.location?`<div style="font-size:7.5px;color:#333;margin-bottom:3px;">📍 ${d.location}</div>`:''}
        ${d.skills?`<div style="font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${darkBg};margin:14px 0 8px;border-bottom:2px solid ${darkBg};padding-bottom:4px;">Skills</div>${skillDots(d.skills,darkBg)}`:''}
      </div>
      <div style="background:#fff;padding:0;">
        <div style="background:${darkBg};padding:20px 22px;">
          <div class="rv-name" style="color:${yellowColor};font-size:24px;font-weight:900;text-transform:uppercase;">${d.name}</div>
          <div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">${d.role}</div>
        </div>
        <div style="padding:18px 22px;">${body}</div>
      </div>
    </div>`;

  } else if(tpl==='nordic-clean'){
    html=`<div class="rv" style="font-family:'Helvetica',sans-serif;line-height:${SP};padding:36px 40px;">
      <div style="${headerFlex}margin-bottom:20px;">
        ${photoHTML.replace(`border:2px solid ${C}`,'border:2px solid #e2e8f0')}
        <div>
          <div class="rv-name" style="color:#1e293b;font-size:24px;font-weight:300;letter-spacing:1px;">${d.name}</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:4px;">${d.role}</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;font-size:7.5px;color:#94a3b8;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">
        ${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).map(x=>`<span>${x}</span>`).join('<span style="color:#e2e8f0;">|</span>')}
      </div>
      ${body}
    </div>`;

  } else if(tpl==='coral-creative'){
    const coral='#f97316';
    html=`<div class="rv" style="font-family:${F};line-height:${SP};padding:0;">
      <div style="background:linear-gradient(135deg,${coral},#ea580c);padding:24px 28px;position:relative;">
        <div style="${headerFlex}">
          ${photoHTML.replace(`border:2px solid ${C}`,'border:3px solid rgba(255,255,255,.6)')}
          <div>
            <div class="rv-name" style="color:#fff;font-size:22px;">${d.name}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:4px;">${d.role}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;">
          ${[d.email,d.phone,d.location].filter(Boolean).map(x=>`<span style="font-size:7.5px;color:rgba(255,255,255,.85);background:rgba(255,255,255,.15);padding:2px 8px;border-radius:10px;">${x}</span>`).join('')}
        </div>
      </div>
      <div style="padding:20px 28px;">${body}</div>
    </div>`;

  } else if(tpl==='midnight-pro'){
    const teal='#14b8a6';
    html=`<div class="rv" style="font-family:'Helvetica',sans-serif;line-height:${SP};padding:0;">
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:24px 28px;">
        <div style="${headerFlex}">
          ${photoHTML.replace(`border:2px solid ${C}`,`border:2px solid ${teal}`)}
          <div>
            <div class="rv-name" style="color:#fff;font-size:22px;">${d.name}</div>
            <div style="font-size:9px;color:${teal};text-transform:uppercase;letter-spacing:2px;margin-top:4px;">${d.role}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:12px;">
          ${[d.email,d.phone,d.location].filter(Boolean).map(x=>`<span style="font-size:7.5px;color:#94a3b8;">${x}</span>`).join('<span style="color:#334155;">•</span>')}
        </div>
      </div>
      <div style="padding:20px 28px;">
        ${state.sectionOrder.filter(s=>state.sectionVisibility[s]!==false).map(s=>{
          const content=(sectionRenderers[s]||(()=>''))();
          if(!content)return'';
          return`<div style="border-left:2px solid ${teal};padding-left:12px;margin-bottom:12px;">${content}</div>`;
        }).join('')}
      </div>
    </div>`;

  } else if(tpl==='classic-serif'){
    html=`<div class="rv" style="font-family:'Garamond','Georgia',serif;line-height:${SP};padding:32px 36px;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-block;margin-bottom:10px;">${photoHTML.replace(`border:2px solid ${C}`,'border:1px solid #999')}</div>
        <div class="rv-name" style="color:#333;font-size:24px;font-weight:400;letter-spacing:2px;">${d.name}</div>
        <div style="height:1px;background:#999;margin:8px 80px;"></div>
        <div style="font-size:9px;color:#666;font-style:italic;margin-top:4px;">${d.role}</div>
        <div style="font-size:7.5px;color:#888;margin-top:6px;">${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).join(' · ')}</div>
      </div>
      <div style="height:2px;background:#ddd;margin-bottom:14px;"></div>
      ${body}
    </div>`;

  } else if(tpl==='two-column'){
    const mainSections=state.sectionOrder.filter(s=>state.sectionVisibility[s]!==false&&!['skills','languages','certifications'].includes(s));
    const sideSections=['skills','languages','certifications'].filter(s=>state.sectionVisibility[s]!==false);
    const mainBody=mainSections.map(s=>(sectionRenderers[s]||(()=>''))()).filter(Boolean).join('');
    const sideBody=sideSections.map(s=>(sectionRenderers[s]||(()=>''))()).filter(Boolean).join('');
    html=`<div class="rv" style="display:grid;grid-template-columns:65% 35%;padding:0;font-family:${F};line-height:${SP};">
      <div style="padding:24px 22px;">
        <div style="${headerFlex}margin-bottom:14px;">
          ${photoHTML}
          <div>
            <div class="rv-name" style="color:#0891b2;font-size:20px;">${d.name}</div>
            <div style="font-size:9px;color:#64748b;margin-top:2px;">${d.role}</div>
          </div>
        </div>
        <div style="font-size:7.5px;color:#64748b;margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;">
          ${[d.email,d.phone,d.location].filter(Boolean).map(x=>`<span>${x}</span>`).join('')}
        </div>
        <div style="height:1px;background:#e2e8f0;margin-bottom:12px;"></div>
        ${mainBody}
      </div>
      <div style="background:#f1f5f9;padding:24px 16px;border-left:1px solid #e2e8f0;">
        ${sideBody}
      </div>
    </div>`;

  } else {
    // minimal (default)
    html=`<div class="rv" style="font-family:${F};line-height:${SP};">
      <div style="${headerFlex}">
        ${photoHTML}
        <div>
          <div class="rv-name" style="color:#111;">${d.name}</div>
          <div class="rv-contact">${[d.email,d.phone,d.location,d.linkedin].filter(Boolean).map(x=>`<span>${x}</span>`).join('')}</div>
        </div>
      </div>
      <div class="rv-divider" style="background:#111;"></div>
      ${body}
    </div>`;
  }

  const container = document.getElementById('resumePreviewContent');
  
  // Clear any padding on the container so pages span full width
  container.style.padding = '0';
  container.style.background = 'transparent';
  container.style.position = 'relative';

  // Render first page to measure height
  container.innerHTML = `
    <div class="rv-page" id="rvPage1" style="display:block;">
      <div class="rv-page-inner" id="rvPage1Inner">
        <div style="position:absolute; top: 0; width:100%;">
          ${html}
        </div>
      </div>
    </div>
  `;

  // Auto-paginate: check if content exceeds A4 page height
  requestAnimationFrame(()=>{
    const inner = document.getElementById('rvPage1Inner');
    const page = document.getElementById('rvPage1');
    if(!inner || !page) return;
    
    // The visible window for content (accounting for new top/bottom padding)
    const sliceHeight = inner.clientHeight; 
    let contentHeight = inner.scrollHeight;
    const maxPages = state.plan === 'pro' ? 5 : 3;
    let totalPages = Math.min(maxPages, Math.max(1, Math.ceil(contentHeight / sliceHeight)));
    
    const rvElement = inner.querySelector('.rv');
    if(rvElement) {
      rvElement.style.minHeight = (totalPages * sliceHeight) + 'px';
    }
    
    window.totalResumePages = totalPages;
    if(!window.currentResumePage || window.currentResumePage > totalPages) {
      window.currentResumePage = 1;
    }
    
    if(totalPages > 1){
      let extraPagesHTML = '';
      for(let i = 1; i < totalPages; i++){
        extraPagesHTML += `
          <div class="rv-page" id="rvPage${i+1}" style="display:none;">
            <div class="rv-page-inner">
              <div style="position:absolute; top: -${i * sliceHeight}px; width:100%;">
                ${html}
              </div>
            </div>
          </div>
        `;
      }
      container.innerHTML += extraPagesHTML;
    }
    
    for(let i = 0; i < totalPages; i++){
      const p = document.getElementById(`rvPage${i+1}`);
      if(p) {
        p.innerHTML += `<div class="rv-page-number" data-html2canvas-ignore="true">Page ${i+1} of ${totalPages}</div>`;
        const rvChild = p.querySelector('.rv');
        if(rvChild) rvChild.style.minHeight = (totalPages * sliceHeight) + 'px';
      }
    }

    updatePaginationUI();
  });
}

function updatePaginationUI() {
  const controls = document.getElementById('paginationControls');
  const indicator = document.getElementById('pageIndicator');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  
  if(!controls || !window.totalResumePages) return;
  
  if(window.totalResumePages > 1) {
    controls.style.display = 'flex';
    indicator.textContent = `Page ${window.currentResumePage} of ${window.totalResumePages}`;
    btnPrev.disabled = window.currentResumePage <= 1;
    btnNext.disabled = window.currentResumePage >= window.totalResumePages;
    btnPrev.style.opacity = btnPrev.disabled ? '0.4' : '1';
    btnNext.style.opacity = btnNext.disabled ? '0.4' : '1';
  } else {
    controls.style.display = 'none';
  }
  
  document.querySelectorAll('.rv-page').forEach((page, idx) => {
    page.style.display = (idx + 1 === window.currentResumePage) ? 'block' : 'none';
  });
}

function prevResumePage() {
  if(window.currentResumePage > 1) {
    window.currentResumePage--;
    updatePaginationUI();
  }
}

function nextResumePage() {
  if(window.currentResumePage < window.totalResumePages) {
    window.currentResumePage++;
    updatePaginationUI();
  }
}

function calculateScore(){
  let score=0;const fields={name:10,role:10,email:5,phone:5,location:5,summary:15,experience:15,skills:10,degree:5,projects:10,certs:5,achievements:5};
  Object.entries(fields).forEach(([k,pts])=>{
    const id=k==='degree'?'rv-degree':'rv-'+k;
    if(v(id))score+=pts;
  });
  score=Math.min(100,score);
  const sec=document.getElementById('scoreSection');if(sec)sec.hidden=false;
  const ring=document.getElementById('scoreRingFg');
  const offset=264-(264*score/100);
  ring.style.strokeDashoffset=offset;
  ring.style.stroke=score>70?'#22c55e':score>40?'#f59e0b':'#ef4444';
  
  document.getElementById('scoreNumText').textContent=score;
  document.getElementById('resumeScoreSmall').textContent='Score: '+score+'/100';

  const tips=[];
  if(!v('rv-summary'))tips.push({icon:'📝',text:'Add a professional summary'});
  if(!v('rv-experience'))tips.push({icon:'💼',text:'Add work experience'});
  if(!v('rv-skills'))tips.push({icon:'⚙️',text:'List your technical skills'});
  if(!v('rv-projects'))tips.push({icon:'🛠️',text:'Add projects to stand out'});
  if(!v('rv-achievements'))tips.push({icon:'🏆',text:'Add achievements'});
  const tc=document.getElementById('scoreTips');
  if(tc) tc.innerHTML=tips.slice(0,3).map(t=>`<div class="score-tip"><span class="score-tip-icon">${t.icon}</span>${t.text}</div>`).join('');
}

async function downloadResumePDF(){
  if(!isAuthenticated()){openAuth();return;}
  if(state.stats.downloads>=3&&state.plan==='free'){openUpgrade();return;}
  const btn=document.getElementById('dlPDF');const originalText=btn.textContent;
  btn.textContent='⏳ Generating...';btn.disabled=true;
  
  try{
    const{jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'a4',compress:true});
    const container = document.getElementById('resumePreviewContent');
    const pages = container.querySelectorAll('.rv-page');
    const maxPages = state.plan === 'pro' ? 4 : 3;
    const pageCount = Math.min(pages.length, maxPages);
    
    const originalStyle = container.getAttribute('style') || '';
    container.style.width = '794px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.display = 'block';

    document.querySelectorAll('.rv-page-number').forEach(n=>n.style.display='none');
    pages.forEach(p => p.style.display = 'block');
    
    for(let i=0; i<pageCount; i++){
      if(i>0) doc.addPage();
      const canvas=await html2canvas(pages[i],{
        scale:3,
        useCORS:true,
        backgroundColor:'#ffffff',
        logging:false,
        windowWidth: 794
      });
      const imgData=canvas.toDataURL('image/jpeg',0.95);
      const W=595.28, H=841.89;
      doc.addImage(imgData,'JPEG',0,0,W,H,undefined,'FAST');
    }
    
    container.setAttribute('style', originalStyle);
    document.querySelectorAll('.rv-page-number').forEach(n=>n.style.display='block');
    updatePaginationUI();

    const fileName = `${(v('rv-name')||'Resume').replace(/\s+/g,'_')}_CareerPilot.pdf`;
    doc.save(fileName);
    saveToDocHub(fileName, 'Resume PDF', `${pageCount} page(s) • A4`);
    state.stats.downloads++;
    if(document.getElementById('statDownloads')) document.getElementById('statDownloads').textContent=state.stats.downloads;
    saveState();
    showToast('📥',`PDF downloaded successfully!`);
  } catch(e) {
    console.error(e);
    showToast('❌','PDF generation failed.');
  } finally {
    btn.textContent=originalText; btn.disabled=false;
  }
}

// ═══ IMAGE DOWNLOAD ═══
async function downloadResumeImage(){
  if(!isAuthenticated()){openAuth();return;}
  if(state.plan==='free'){openUpgrade();return;}
  try{
    const content=document.getElementById('resumePreviewContent');
    const canvas=await html2canvas(content,{scale:3,useCORS:true,backgroundColor:'#ffffff'});
    const a=document.createElement('a');a.href=canvas.toDataURL('image/png');
    a.download=`${(v('rv-name')||'Resume').replace(/\s+/g,'_')}_CareerPilot.png`;a.click();
    showToast('🖼️','Image downloaded!');
  }catch(e){showToast('❌','Image export error.');}
}

async function downloadText(btn) {
  const content = btn.closest('.result-box').querySelector('.result-content');
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content.textContent);
  a.download = 'careerpilot-output.txt'; a.click();
  showToast('📥', 'Downloaded!');
}

async function downloadResultPDF(btn) {
  const box = btn.closest('.result-box');
  const content = box.querySelector('.result-content');
  const label = box.querySelector('.result-label').textContent;
  
  showToast('⏳', 'Generating PDF...');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    
    doc.setFontSize(18);
    doc.setTextColor(34, 197, 94);
    doc.text('CareerPilot AI — ' + label, 40, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated on: ' + new Date().toLocaleString(), 40, 65);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(40, 75, 555, 75);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const splitText = doc.splitTextToSize(content.innerText, 515);
    doc.text(splitText, 40, 95);
    
    const fileName = 'careerpilot-' + label.toLowerCase().replace(/\s+/g, '-') + '.pdf';
    doc.save(fileName);
    saveToDocHub(fileName, label.includes('Report') ? 'Report' : label.includes('Bio') ? 'Bio' : label.includes('Email') ? 'Email' : 'Cover Letter', content.innerText);
    showToast('✅', 'PDF downloaded!');
  } catch (e) {
    console.error(e);
    showToast('❌', 'PDF export failed.');
  }
}

// ═══ VERSION CONTROL ═══
function saveResumeVersion(){
  if(!isAuthenticated()){openAuth();return;}
  if(!state.resumeGenerated){showToast('⚠️','Generate a resume first');return;}
  const ver={id:Date.now(),name:'v'+(state.versions.length+1),date:new Date().toLocaleDateString(),data:{},template:state.currentTemplate,color:state.resumeColor};
  ['rv-name','rv-role','rv-email','rv-phone','rv-location','rv-linkedin','rv-summary','rv-experience','rv-degree','rv-institution','rv-year','rv-gpa','rv-edu2','rv-skills','rv-softskills','rv-languages','rv-projects','rv-certs','rv-achievements'].forEach(id=>{ver.data[id]=v(id);});
  state.versions.push(ver);saveState();renderVersions();showToast('💾','Version saved!');
}
function renderVersions(){
  const bar=document.getElementById('versionBar');
  if(!state.versions.length){bar.innerHTML='<span style="font-size:.72rem;color:var(--muted);">No saved versions</span>';return;}
  bar.innerHTML=state.versions.map((ver,i)=>`<div class="version-chip ${i===state.versions.length-1?'active':''}" onclick="loadVersion(${i})">${ver.name} · ${ver.date}</div>`).join('');
}
function loadVersion(i){
  const ver=state.versions[i];if(!ver)return;
  Object.entries(ver.data).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val;});
  state.currentTemplate=ver.template||'minimal';state.resumeColor=ver.color||'#22c55e';
  renderTemplates();renderResume();calculateScore();
  document.querySelectorAll('.version-chip').forEach((c,j)=>c.classList.toggle('active',j===i));
  showToast('📂','Version loaded!');
}

// ═══ BIO SUGGESTIONS (Threads-style) ═══
const BIO_SUGGESTIONS = [
  { category: '🚀 Tech', bios: [
    '💻 Building the future, one line of code at a time',
    '🔧 Full-stack dev | Open source contributor | Coffee addict',
    '📱 Turning ideas into apps that people actually use',
    '🤖 AI/ML enthusiast | Problem solver | Tech blogger',
    '⚡ Code. Ship. Repeat. | {framework} developer',
  ]},
  { category: '📈 Business', bios: [
    '📊 Turning data into decisions | Strategy & Growth',
    '💼 Helping brands scale from zero to millions',
    '🎯 Marketing strategist | Content creator | Growth hacker',
    '🏗️ Building businesses that solve real problems',
    '📉→📈 I make numbers go up | Business Development',
  ]},
  { category: '🎨 Creative', bios: [
    '🎨 Making the internet beautiful, one pixel at a time',
    '✨ Design is not what it looks like — it\'s how it works',
    '📸 Visual storyteller | Brand designer | Creative thinker',
    '🖌️ UX/UI designer | Human-centered design advocate',
    '🌈 Creating experiences that spark joy',
  ]},
  { category: '🎓 Student', bios: [
    '📚 Learning. Building. Growing. | CS @ University',
    '🌱 Aspiring developer | Always curious | Open to opportunities',
    '🔬 Research enthusiast | Academic explorer | Future innovator',
    '💡 Student by day, builder by night | Class of 202X',
    '🚀 On a mission to learn everything | Student developer',
  ]},
];

function renderBioSuggestions(){
  const container = document.getElementById('bioSuggestions');
  if(!container) return;
  container.innerHTML = BIO_SUGGESTIONS.map(cat => `
    <div class="bio-suggest-category">
      <div class="bio-suggest-cat-title">${cat.category}</div>
      <div class="bio-suggest-chips">
        ${cat.bios.map(bio => `<button class="bio-suggest-chip" onclick="useBioSuggestion(this)" data-bio="${bio.replace(/"/g,'&quot;')}">${bio}</button>`).join('')}
      </div>
    </div>
  `).join('');
}

function useBioSuggestion(btn){
  const bio = btn.dataset.bio;
  const nameField = document.getElementById('bio-name');
  const profField = document.getElementById('bio-profession');
  const achField = document.getElementById('bio-achievement');
  
  // Parse bio into achievement field for editing
  if(achField) achField.value = bio;
  
  // Visual feedback
  document.querySelectorAll('.bio-suggest-chip').forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
  showToast('✨', 'Bio suggestion applied! Customize it further.');
}

// Initialize bio suggestions on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  renderBioSuggestions();
});

function aiGenerateBio(){
  runAITool('bio');
}
