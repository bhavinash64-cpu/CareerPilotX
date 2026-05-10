// ═══════════════════════════════════════════
// CAREER PILOT — AI TOOLS (FAIL-SAFE PRODUCTION)
// ═══════════════════════════════════════════

const AI_API_BASE = 'http://localhost:3000';
const USE_FALLBACK_IF_BACKEND_FAILS = true;

// ═══ CORE API CALL ═══
async function callAI(type, input) {
  try {
    const response = await fetch(`${AI_API_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, input, plan: 'pro' })
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('[CareerPilot] Backend unreachable, using browser-AI fallback.');
  }

  if (USE_FALLBACK_IF_BACKEND_FAILS) {
    return await callBrowserAI(type, input);
  }
  throw { message: 'AI Connection failed' };
}

// ═══ CORE IMAGE API CALL ═══
async function callImageAI(prompt) {
  try {
    const response = await fetch(`${AI_API_BASE}/api/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  
  // Direct Pollinations Fallback for Images
  const seed = Math.floor(Math.random() * 1000000);
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
  return { success: true, image: imgUrl, provider: 'Pollinations (Browser)' };
}

// ═══ BROWSER-BASED AI FALLBACK (No backend needed) ═══
async function callBrowserAI(type, input) {
  const prompt = `You are CareerPilot AI. Act as an expert career coach. Task: ${type}. Input Data: ${JSON.stringify(input)}. Provide a professional, detailed, and actionable response. Use markdown formatting.`;
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}`;
  const res = await fetch(url);
  const text = await res.text();
  return { success: true, output: text, provider: 'Browser-AI' };
}

// ═══ FALLBACKS (Static templates when AI is disconnected) ═══
function getFallbackResponse(tool, input) {
  const fallbacks = {
    cover: () => "Dear Hiring Manager,\n\nI am writing to express my strong interest in the role. With my background in technology and passion for innovation, I am confident I can contribute significantly to your team.\n\nBest regards,\nCandidate",
    email: () => "Subject: Application for Role\n\nHi,\n\nI am interested in this position. Please find my resume attached.\n\nThanks!",
    bio: () => "Option 1: Tech Innovator | Solution Architect\nOption 2: Passionate Developer & Tech Enthusiast\nOption 3: Building the future of web tech.",
    gps: () => "═══ CAREER GPS MAP 🗺️ ═══\n\n📍 START: " + (input.currentRole || 'Student') + "\n🏁 DESTINATION: " + (input.goalRole || 'Senior Engineer') + "\n\n⚠️ Connect the AI backend for real AI-powered career mapping.",
    projects: () => "═══ PROJECT IDEAS ═══\n\n1. AI-Powered Portfolio\n2. Real-time Dashboard\n3. Personalized Career Tracker",
    roast: () => "═══ RESUME ROAST 🔥 ═══\n\n💀 THE BRUTAL TRUTH:\nYour resume is good, but let's make it great with real AI fire!"
  };
  const generator = fallbacks[tool];
  return generator ? generator() : 'AI tool is processing...';
}

// ═══ MAIN AI TOOL RUNNER ═══
async function runAITool(tool) {
  const resultEl = document.getElementById(tool + '-result');
  if (!resultEl) return;

  resultEl.innerHTML = `
    <div class="result-box ai-loading">
      <div class="ai-loading-spinner"></div>
      <div class="ai-loading-text">AI is thinking...</div>
    </div>
  `;

  const input = collectInput(tool);
  try {
    const result = await callAI(tool, input);
    let output = result.output;

    // GPS Image Generation
    if (tool === 'gps') {
      const gpsRes = document.getElementById('gps-result');
      const imgContainer = document.createElement('div');
      imgContainer.innerHTML = `<div id="gpsImageDisplay" style="margin-top:1rem; width:100%; aspect-ratio:16/9; background:rgba(0,0,0,0.2); border-radius:8px; display:flex; align-items:center; justify-content:center;">Generating Visual Map...</div>`;
      gpsRes.appendChild(imgContainer);
      
      callImageAI(input.currentRole + " to " + input.goalRole).then(imgData => {
        const display = document.getElementById('gpsImageDisplay');
        if (imgData.success) {
          display.innerHTML = `<img src="${imgData.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;"/>`;
        }
      });
    }

    const formatted = output.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    resultEl.innerHTML = `<div class="result-box"><div class="result-head"><div class="result-label">🤖 AI GENERATED</div></div><div class="result-content">${formatted}</div></div>`;
  } catch (error) {
    resultEl.innerHTML = `<div class="result-box">${getFallbackResponse(tool, input)}</div>`;
  }
}

// ═══ AI CHAT (Real-time) ═══
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  const messages = document.getElementById('chatMessages');
  messages.innerHTML += `<div class="chat-bubble user">${msg}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `<div id="${typingId}"><div class="chat-ai-label">🤖 CAREERPILOT AI</div><div class="chat-bubble ai" style="opacity:.6;">Thinking...</div></div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const result = await callAI('chat', { message: msg });
    const formatted = result.output.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `<div><div class="chat-ai-label">🤖 CAREERPILOT AI</div><div class="chat-bubble ai">${formatted}</div></div>`;
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `<div class="chat-bubble ai">I'm having trouble connecting right now, but I'm here to help!</div>`;
  }
}

function collectInput(tool) {
  if (tool === 'cover') return { name: document.getElementById('cov-name')?.value, role: document.getElementById('cov-role')?.value, company: document.getElementById('cov-company')?.value, skills: document.getElementById('cov-skills')?.value };
  if (tool === 'gps') return { currentRole: document.getElementById('gps-current')?.value, goalRole: document.getElementById('gps-dream')?.value };
  return {};
}

function showToast(icon, msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent = msg;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
