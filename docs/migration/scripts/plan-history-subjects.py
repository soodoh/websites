"""Plan subject-only normalization. Reads target Git; writes only scratch output."""
import collections
import json
import pathlib
import re
import subprocess
import argparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--repo', type=pathlib.Path, default=pathlib.Path.cwd())
parser.add_argument('--output-directory', type=pathlib.Path, required=True)
parser.add_argument('--head', default='HEAD')
args = parser.parse_args()
repo = args.repo.resolve()
out = args.output_directory.resolve()
out.mkdir(parents=True, exist_ok=True)
apps = {'carolyn-portfolio': 'carolyn', 'portfolio-website': 'paul', 'diloreto-website': 'diloreto', 'sarabeth-studio': 'sarabeth'}
allowed_types = {'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'}
allowed_scopes = set(apps.values()) | {'repo', 'ci', 'deps'}
pattern = re.compile(r'^([A-Za-z]+)(?:\(([^)]*)\))?(!)?:\s*(.+)$')
# Explicit review of subjects and changed-path lists for otherwise ambiguous legacy titles.
reviewed_legacy_types = {
    '9c2a2ea2': 'fix', 'a22e5c0b': 'fix', '445c54ae': 'build', 'e409343e': 'perf',
    '45ca644f': 'fix', '26cc2bd7': 'fix', 'd4098d64': 'fix', '8049e1c3': 'fix',
    'ae210978': 'fix', '91d016bc': 'feat', '3aa5c819': 'fix', '0632876d': 'fix',
    '80ec74cc': 'chore', 'a2973f4a': 'feat', 'e43df205': 'fix', '8fa64752': 'chore',
    '503f37ed': 'feat', '872a8012': 'fix', 'c053659d': 'chore', '7f25e404': 'fix',
    '612b937d': 'build', '036a9c82': 'feat', '86034a2c': 'fix', '730e14df': 'fix',
    'b0a998f0': 'fix', 'a2be1590': 'build', 'c48e8d5d': 'refactor', '20f4cd7d': 'fix',
    'd29094f8': 'fix', '0f811cad': 'fix', '5963ca1e': 'refactor', '87a26c6d': 'refactor',
    '1bb9e38f': 'chore', '3aea6b94': 'chore', 'a68ba57d': 'chore', 'e8ec025e': 'chore',
    '8509cc7c': 'feat', '01599d97': 'chore', '6b67d14e': 'chore', '039d989a': 'chore',
    '28d09803': 'chore', '86ab2663': 'feat', '5d69ca26': 'refactor', '9e622a06': 'refactor',
    'fb107a37': 'refactor',
}

def git(*args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

head = git('rev-parse', args.head).decode().strip()
membership = collections.defaultdict(list)
source_data = json.loads(git('show', f'{head}:docs/migration/source-imports.json'))
for source in source_data['sources']:
    scope = apps[source['name']]
    source_head = source.get('importedSha', source['approvedSha'])
    for sha in git('rev-list', source_head).decode().splitlines():
        membership[sha].append(scope)


def paths_at(sha, parents):
    if parents:
        data = git('diff-tree', '--no-commit-id', '--name-only', '-r', '-z', parents[0], sha)
    else:
        data = git('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', sha)
    return [p.decode() for p in data.split(b'\0') if p]


def choose_type(subject, paths, parents):
    lower = subject.lower()
    if paths and all(p.lower().endswith(('.md', '.mdx', '.rst', '.txt')) for p in paths):
        return 'docs', 'documentation-only paths'
    if lower.startswith('revert '):
        return 'revert', 'explicit original revert subject'
    if len(parents) > 1 and re.match(r'merge[d]?\b', lower):
        return 'chore', 'merge bookkeeping'
    if re.match(r'(first|initial)\b', lower):
        return 'chore', 'initial project setup'
    if paths and all('/.github/' in '/' + p or p.startswith('.github/') for p in paths):
        return 'ci', 'workflow-only paths'
    if paths and all(re.search(r'(^|/)(test[s]?|e2e)(/|\.)', p) for p in paths):
        return 'test', 'test-only paths'
    if re.search(r'\b(read\s?me|documentation)\b', lower):
        return 'docs', 'explicit documentation subject'
    if re.search(r'(lint(?:ing)? (?:fix|error)|formatting completed|coding style)', lower):
        return 'style', 'explicit formatting/lint correction'
    if re.match(r'fix(?:ed)?\b', lower) or 'audit fixes' in lower:
        return 'fix', 'explicit correction subject'
    if re.match(r'(optimiz|switched to faster)', lower):
        return 'perf', 'explicit optimization subject'
    if re.search(r'(refactor|consolidat|abstract|\bmigrat|\breplac|^mov(?:e|ed)\b|removed uses|use.*instead|interfaces instead)', lower):
        return 'refactor', 'explicit restructuring/replacement subject'
    if re.search(r'(\bdeps\b|dependenc|npm packages|updated packages|package-lock|package.json|\bbump\b|version upgrade|\bupgrade[ds]?\b)', lower):
        return 'build', 'dependency/toolchain subject'
    if re.search(r'(eslint|prettier|renovate|webpack|netlify|\bplugin\b|typescript|production build|gatsby port)', lower):
        return 'build', 'build/tooling integration subject'
    if re.match(r'(add(?:ed)?|readd|new|finish(?:ed)?|got|wired|working|almost|set up|stage 1)\b', lower) or re.search(r'\bwip\b', lower):
        return 'feat', 'feature implementation/progress subject'
    if re.match(r'(fixed|tweak|changed|made|limit|increased|updated.*(?:tag|bio)|project thumbnail)', lower):
        return 'fix', 'existing behavior/content adjustment subject'
    return 'chore', 'ambiguous legacy subject; retain original wording rather than invent a feature claim'

records = []
for sha in git('rev-list', '--reverse', '--topo-order', head).decode().splitlines():
    raw = git('cat-file', 'commit', sha)
    headers, message = raw.split(b'\n\n', 1)
    subject_block, paragraph_separator, original_body = message.partition(b'\n\n')
    original = ' '.join(subject_block.decode('utf8').splitlines()).strip()
    parents = [l[7:].decode() for l in headers.splitlines() if l.startswith(b'parent ')]
    match = pattern.match(original)
    known = match is not None and match.group(1).lower() in allowed_types
    paths = paths_at(sha, parents)
    scopes = membership.get(sha, [])
    assert len(scopes) <= 1, 'Shared source ancestry needs manual scope decision'
    if scopes:
        scope = scopes[0]
        scope_reason = 'unambiguous imported source-main ancestry'
    elif known and match.group(2) in allowed_scopes:
        scope = match.group(2)
        scope_reason = 'already approved migration scope'
    else:
        path_scopes = set()
        shared = False
        for p in paths:
            found = False
            for old, short in apps.items():
                if p.startswith(f'apps/{old}/') or p.startswith(f'apps/{short}/'):
                    path_scopes.add(short)
                    found = True
                    break
            if not found:
                shared = True
        if len(path_scopes) == 1 and not shared:
            scope = next(iter(path_scopes))
            scope_reason = 'one app changed against first parent'
        elif paths and all(p.startswith('.github/') for p in paths):
            scope = 'ci'
            scope_reason = 'shared automation-only paths'
        elif paths and all(pathlib.PurePosixPath(p).name in {'package.json', 'bun.lock'} for p in paths):
            scope = 'deps'
            scope_reason = 'shared dependency-only paths'
        else:
            scope = 'repo'
            scope_reason = 'shared workspace/migration/initial history'
    if known:
        kind, type_reason = match.group(1).lower(), 'preserved existing conventional type'
        title = match.group(4).strip()
        breaking = match.group(3) or ''
    else:
        kind, type_reason = choose_type(original, paths, parents)
        if sha[:8] in reviewed_legacy_types:
            kind = reviewed_legacy_types[sha[:8]]
            type_reason = 'reviewed legacy subject and changed-path list'
        title = original or 'record repository changes'
        breaking = ''
    if sha == 'a98b8dc7424a7b176afffc82f9a48495050b6032':
        title = 'undo BannerImage imageLoader change'
    elif sha == '8b6a35bdf1c25d9db43b1b075e3697f414397e16':
        title = 'restore Router styles fix'
    # Adjust only the subject, never original body/footer bytes.
    title = title[0].lower() + title[1:] if title else 'record repository changes'
    title = title.rstrip('.').strip()
    prefix = f'{kind}({scope}){breaking}: '
    maximum = 100 - len(prefix)
    if len(title) > maximum:
        title = title[:maximum-3].rsplit(' ', 1)[0].rstrip(' .') + '...'
        # Conventional subject-full-stop disallows a trailing period.
        title = title.rstrip('.') + '…'
    normalized = prefix + title
    new_message = normalized.encode() + (paragraph_separator + original_body if paragraph_separator else (b'\n' if message.endswith(b'\n') else b''))
    records.append({'oldSha': sha, 'originalSubject': original, 'normalizedSubject': normalized,
                    'typeReason': type_reason, 'scopeReason': scope_reason,
                    'message': new_message.decode(), 'changedSubject': normalized != original})
(out / 'message-plan.json').write_text(json.dumps({'head': head, 'records': records}, indent=2) + '\n')
print(json.dumps({'head': head, 'commits': len(records), 'changedSubjects': sum(r['changedSubject'] for r in records),
                  'scopes': dict(collections.Counter(pattern.match(r['normalizedSubject']).group(2) for r in records)),
                  'inferredTypes': dict(collections.Counter(r['typeReason'] for r in records if r['typeReason'] != 'preserved existing conventional type'))}, indent=2))
