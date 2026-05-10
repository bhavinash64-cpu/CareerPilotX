import os, requests

API_KEY = os.environ.get("NVIDIA_API_KEY", "")
if not API_KEY:
    print("Set NVIDIA_API_KEY env var")
    exit(1)

invoke_url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev"
headers = { "Authorization": f"Bearer {API_KEY}", "Accept": "application/json" }
payload = { "prompt": "a simple coffee shop interior", "mode": "base", "cfg_scale": 3.5, "width": 1024, "height": 1024, "seed": 0, "steps": 50 }
res = requests.post(invoke_url, headers=headers, json=payload)
print(res.text[:500])
