import urllib.request
import re

url = 'https://docs.nvidia.com/nim/visual-genai/latest/api/qwen-image.html'
try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode()
        urls = re.findall(r'https://[^\"\'\s<>]+', html)
        print('Unique URLs:', set([u for u in urls if 'api' in u or 'v1' in u]))
except Exception as e:
    print('ERROR:', e)
