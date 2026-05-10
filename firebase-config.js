// ═══════════════════════════════════════════
// CAREER PILOT — FIREBASE CONFIGURATION
// ═══════════════════════════════════════════
// 
// ⚠️ SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Enable Authentication → Google Sign-In
// 4. Enable Cloud Firestore
// 5. Replace the config below with YOUR project credentials
// 6. Add your domain to Authorized Domains in Firebase Auth settings
//
// ═══════════════════════════════════════════

// ▶▶▶ REPLACE THIS WITH YOUR FIREBASE CONFIG ◀◀◀
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwitl6XDut9DdoZssabcHcyu_OFfP9u-M",
  authDomain: "studio-1700168146-ea83e.firebaseapp.com",
  projectId: "studio-1700168146-ea83e",
  storageBucket: "studio-1700168146-ea83e.firebasestorage.app",
  messagingSenderId: "556036591026",
  appId: "1:556036591026:web:0f3fe22b7929d25f5ae8ab"
};

// ═══ CHECK IF FIREBASE IS CONFIGURED ═══
function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE" && 
         FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID";
}

// ═══ FIREBASE INITIALIZATION ═══
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let currentFirebaseUser = null;

function initFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn('[CareerPilot] Firebase not configured. Using local-only mode.');
    return false;
  }

  try {
    // Initialize Firebase
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();

    // Listen for auth state changes
    firebaseAuth.onAuthStateChanged(handleAuthStateChange);

    console.log('[CareerPilot] Firebase initialized successfully');
    return true;
  } catch (e) {
    console.error('[CareerPilot] Firebase initialization failed:', e);
    return false;
  }
}

// ═══ AUTH STATE HANDLER ═══
async function handleAuthStateChange(user) {
  if (user) {
    currentFirebaseUser = user;
    
    // Sync Firebase user data to local state
    state.auth = { provider: 'google', guestStartedAt: null };
    state.user = {
      name: user.displayName || 'User',
      email: user.email || '',
      initials: getInitials(user.displayName || user.email || 'U'),
      photoStyle: state.user?.photoStyle || 'style1',
      uid: user.uid
    };

    // Fetch user document from Firestore
    await syncFromFirestore(user.uid);
    
    saveState();
    applyAuthUI();
    applyState();

    // If on landing page, go to dashboard
    if (document.querySelector('.page.active')?.id === 'landing') {
      setActivePage('dashboard');
    }
  } else {
    currentFirebaseUser = null;
    // Don't auto-logout if in guest mode
    if (state.auth?.provider === 'google') {
      state.auth = { provider: null, guestStartedAt: null };
      state.user = { name: 'Guest User', email: 'guest@careerpilot.ai', initials: 'G' };
      saveState();
      applyAuthUI();
      enforceLandingOnly();
    }
  }
}

// ═══ GOOGLE SIGN-IN (FIREBASE) ═══
async function firebaseGoogleSignIn() {
  if (!isFirebaseConfigured()) {
    // Fallback to local simulation
    return false;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await firebaseAuth.signInWithPopup(provider);
    const user = result.user;

    // Create/update user document in Firestore
    await createOrUpdateFirestoreUser(user);

    showToast('✈', 'Signed in with Google successfully!');
    return true;
  } catch (error) {
    console.error('[CareerPilot] Google sign-in failed:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      showToast('ℹ️', 'Sign-in cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      showToast('⚠️', 'Popup blocked. Please allow popups for this site.');
    } else {
      showToast('❌', 'Sign-in failed: ' + error.message);
    }
    return false;
  }
}

// ═══ SIGN OUT ═══
async function firebaseSignOut() {
  if (!isFirebaseConfigured() || !firebaseAuth) return;

  try {
    await firebaseAuth.signOut();
    currentFirebaseUser = null;
    state.auth = { provider: null, guestStartedAt: null };
    state.plan = 'free';
    saveState();
    applyAuthUI();
    enforceLandingOnly();
    showToast('👋', 'Signed out successfully');
  } catch (e) {
    console.error('[CareerPilot] Sign-out error:', e);
  }
}

// ═══ FIRESTORE OPERATIONS ═══
async function createOrUpdateFirestoreUser(user) {
  if (!firebaseDb || !user) return;

  try {
    const userRef = firebaseDb.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (doc.exists) {
      // Update last login
      await userRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        name: user.displayName || doc.data().name,
        email: user.email
      });
      
      // Sync plan from Firestore
      const data = doc.data();
      if (data.plan) {
        state.plan = data.plan;
      }
    } else {
      // Create new user document
      await userRef.set({
        name: user.displayName || 'User',
        email: user.email || '',
        plan: 'free',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        stats: { resumes: 0, downloads: 0, tools: 0, ats: '—' },
        profileStrength: 20
      });
    }
  } catch (e) {
    console.error('[CareerPilot] Firestore user sync error:', e);
  }
}

async function syncFromFirestore(uid) {
  if (!firebaseDb || !uid) return;

  try {
    const doc = await firebaseDb.collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data();
      state.plan = data.plan || 'free';
      state.stats = data.stats || state.stats;
      state.profileStrength = data.profileStrength || state.profileStrength;
    }
  } catch (e) {
    console.error('[CareerPilot] Firestore sync error:', e);
  }
}

async function updateFirestorePlan(plan) {
  if (!firebaseDb || !currentFirebaseUser) return;

  try {
    await firebaseDb.collection('users').doc(currentFirebaseUser.uid).update({
      plan: plan,
      planUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error('[CareerPilot] Plan update error:', e);
  }
}

async function updateFirestoreStats() {
  if (!firebaseDb || !currentFirebaseUser) return;

  try {
    await firebaseDb.collection('users').doc(currentFirebaseUser.uid).update({
      stats: state.stats,
      profileStrength: state.profileStrength
    });
  } catch (e) {
    console.error('[CareerPilot] Stats update error:', e);
  }
}

// ═══ HELPERS ═══
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}
