
async function run() {
  const API_KEY = process.env.NVIDIA_API_KEY || "";
  if (!API_KEY) { console.error("Set NVIDIA_API_KEY env var"); process.exit(1); }
  try {
    const res = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ "prompt": "a simple coffee shop interior", "mode": "base", "cfg_scale": 3.5, "width": 1024, "height": 1024, "seed": 0, "steps": 50 })
    });
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch(e) { console.error(e); }
}
run();
