"""Generate profile SVG cards using public GitHub data; Python standard library only."""
from collections import Counter
from datetime import datetime, timezone
from html import escape
from pathlib import Path
import json
import os
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
USERNAME = os.environ.get('PROFILE_USERNAME', 'tunsbuiz26')
if not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})', USERNAME):
    raise ValueError('Invalid GitHub username')

def get(route):
    headers = {'User-Agent': 'github-profile-statistics', 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    token = os.environ.get('GH_TOKEN')
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request('https://api.github.com/' + route, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)

def collect():
    user = get('users/' + USERNAME)
    repositories = []
    page = 1
    while True:
        batch = get(f'users/{USERNAME}/repos?type=owner&per_page=100&page={page}')
        repositories.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    owned = [r for r in repositories if not r['fork'] and not r['private']]
    languages = Counter(r['language'] for r in owned if r['language'])
    return {
        'public_repos': user['public_repos'],
        'followers': user['followers'],
        'stars': sum(r['stargazers_count'] for r in owned),
        'forks': sum(r['forks_count'] for r in owned),
        'languages': languages,
        'owned_count': len(owned),
        'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
    }

def base(theme, title, description):
    bg, fg, muted, border = ('#ffffff','#0f172a','#64748b','#dbeafe') if theme == 'light' else ('#0d1117','#f0f6fc','#94a3b8','#243044')
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="440" height="250" viewBox="0 0 440 250" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc><rect x=".5" y=".5" width="439" height="249" rx="14" fill="{bg}" stroke="{border}"/><text x="24" y="33" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="{fg}">{escape(title)}</text>']
    return svg, fg, muted

def render(data):
    result = {}
    for theme in ('light','dark'):
        accent = '#0875c5' if theme == 'light' else '#38bdf8'
        stats, fg, muted = base(theme, 'GitHub at a glance', 'Public repositories, followers, and stars and forks received by owned public repositories.')
        stats.append(f'<text x="24" y="54" font-family="Arial,sans-serif" font-size="11" fill="{muted}">@{escape(USERNAME)} · Public account data</text>')
        for i, (label, number) in enumerate([('Public repositories',data['public_repos']),('Stars received',data['stars']),('Followers',data['followers']),('Forks received',data['forks'])]):
            x, y = 24 + (i % 2) * 208, 101 + (i // 2) * 76
            stats.append(f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="29" font-weight="700" fill="{accent}">{number:,}</text><text x="{x}" y="{y+21}" font-family="Arial,sans-serif" font-size="12" fill="{fg}">{label}</text>')
        stats.append(f'<text x="24" y="231" font-family="Arial,sans-serif" font-size="10" fill="{muted}">Public API snapshot · {data["date"]} UTC</text></svg>')
        result[f'stats-{theme}.svg'] = ''.join(stats)
        card, fg, muted = base(theme, 'Repository languages', 'Primary language counts across owned public repositories; not a proficiency score.')
        card.append(f'<text x="24" y="54" font-family="Arial,sans-serif" font-size="11" fill="{muted}">Primary language · Owned public repositories</text>')
        values = data['languages'].most_common()
        rows = values[:5]
        if len(values) > 5:
            rows.append(('Other', sum(n for _,n in values[5:])))
        maximum = max((n for _,n in rows), default=1)
        for i, (name, count) in enumerate(rows):
            y = 82 + i*24
            bar = max(3, count/maximum*180)
            card.append(f'<text x="24" y="{y}" font-family="Arial,sans-serif" font-size="11" fill="{fg}">{escape(name)}</text><rect x="134" y="{y-8}" width="{bar:.1f}" height="7" rx="3.5" fill="{accent}"/><text x="390" y="{y}" text-anchor="end" font-family="Arial,sans-serif" font-size="11" fill="{fg}">{count}</text>')
        if not rows:
            card.append(f'<text x="24" y="104" font-family="Arial,sans-serif" font-size="12" fill="{muted}">No primary language data available.</text>')
        card.append(f'<text x="24" y="231" font-family="Arial,sans-serif" font-size="10" fill="{muted}">{data["owned_count"]} owned public repositories · Forks excluded</text></svg>')
        result[f'languages-{theme}.svg'] = ''.join(card)
    return result

if __name__ == '__main__':
    # Fetch and build every card before replacing files. An API failure preserves existing cards.
    data = collect()
    cards = render(data)
    ASSETS.mkdir(exist_ok=True)
    for filename, content in cards.items():
        temporary = ASSETS / (filename + '.tmp')
        temporary.write_text(content + '\n', encoding='utf-8')
        temporary.replace(ASSETS / filename)
    print(json.dumps(data, default=dict))
