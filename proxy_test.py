import requests, urllib.parse, re

proxies = [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
]
query = 'Ski Mask The Slump God type beat free for profit vibe'
youtube_url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(query)
print('SEARCH URL:', youtube_url)
for proxy in proxies:
    full = proxy + urllib.parse.quote(youtube_url)
    print('\nPROXY:', proxy)
    try:
        r = requests.get(full, timeout=15)
        print('STATUS', r.status_code, 'CONTENT-TYPE', r.headers.get('content-type'))
        text = r.text
        print('TEXT LENGTH', len(text))
        m = re.search(r'"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"', text)
        print('videoId match', m.group(1) if m else None)
        if not m:
            m2 = re.search(r'/watch\?v=([A-Za-z0-9_-]{11})', text)
            print('watch?v match', m2.group(1) if m2 else None)
        print('SNIPPET', text[:600])
    except Exception as e:
        print('ERROR', e)
