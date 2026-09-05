"""Verify every commit, not merely aggregate count or final tree."""
import argparse
import json
import pathlib
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('scratch_directory', type=pathlib.Path, help='Contains original.git, normalized.git and message-plan.json')
base = parser.parse_args().scratch_directory.resolve()
old = base / 'original.git'
new = base / 'normalized.git'

def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

def header_fields(raw):
    result = []
    for line in raw.splitlines():
        if line.startswith(b' '):
            key, value = result[-1]
            result[-1] = (key, value + b'\n' + line)
        else:
            key, value = line.split(b' ', 1)
            result.append((key, value))
    return result

mapping = dict(line.split() for line in (new / 'filter-repo/commit-map').read_text().splitlines()[1:])
plan = json.loads((base / 'message-plan.json').read_text())
planned = {r['oldSha']: r for r in plan['records']}
old_commits = set(git(old, 'rev-list', 'main').decode().splitlines())
new_commits = set(git(new, 'rev-list', 'main').decode().splitlines())
assert set(mapping) == old_commits == set(planned)
assert set(mapping.values()) == new_commits
assert len(mapping) == len(new_commits)
removed_signatures = []
subject_paragraph_reflows = []
for before, after in mapping.items():
    oh, om = git(old, 'cat-file', 'commit', before).split(b'\n\n', 1)
    nh, nm = git(new, 'cat-file', 'commit', after).split(b'\n\n', 1)
    expected = []
    for key, value in header_fields(oh):
        if key in (b'gpgsig', b'gpgsig-sha256'):
            removed_signatures.append({'oldSha': before, 'header': key.decode()})
            continue
        if key == b'parent':
            value = mapping[value.decode()].encode()
        expected.append((key, value))
    assert expected == header_fields(nh), 'Unexpected non-message metadata change: ' + before
    assert nm == planned[before]['message'].encode(), 'Message differs from linted plan'
    assert om.partition(b'\n\n')[2] == nm.partition(b'\n\n')[2], 'Body/footer bytes changed'
    if len(om.partition(b'\n\n')[0].strip().splitlines()) > 1:
        subject_paragraph_reflows.append(before)

source_data = json.loads(git(old, 'show', 'main:docs/migration/source-imports.json'))
source_proofs = []
for source in source_data['sources']:
    before_head = source.get('importedSha', source['approvedSha'])
    before_import = source['importCommit']
    head, imported = mapping[before_head], mapping[before_import]
    subtree = git(new, 'rev-parse', imported + ':' + source['targetPrefix']).decode().strip()
    tree = git(new, 'rev-parse', head + '^{tree}').decode().strip()
    assert subtree == tree == source['sourceTreeId']
    assert not git(new, 'rev-list', head, '--not', 'main')
    subprocess.run(['git', '-C', str(new), 'merge-base', '--is-ancestor', head, 'main'], check=True)
    source_proofs.append({'name': source['name'], 'beforeImportedHead': before_head, 'normalizedImportedHead': head,
                         'beforeImportCommit': before_import, 'normalizedImportCommit': imported,
                         'pristineImportPrefix': source['targetPrefix'], 'tree': tree,
                         'reachableCommitCount': int(git(new, 'rev-list', '--count', head)),
                         'allAncestorsAndPristineTreeVerified': True})
start = source_data['target']['startingSha']
subprocess.run(['git', '-C', str(new), 'merge-base', '--is-ancestor', mapping[start], 'main'], check=True)
assert subprocess.run(['git', '-C', str(new), 'cat-file', '-e', start + '^{commit}'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode != 0
result = {
    'beforeHead': plan['head'], 'normalizedHead': git(new, 'rev-parse', 'main').decode().strip(),
    'commitsVerified': len(mapping), 'changedCommitIds': sum(a != b for a,b in mapping.items()),
    'changedSubjects': sum(r['changedSubject'] for r in plan['records']),
    'allTreeIdsAuthorCommitterDatesBodiesAndMappedParentsVerified': True,
    'subjectParagraphReflows': subject_paragraph_reflows, 'removedSignatures': removed_signatures,
    'originalInitialCommit': start, 'normalizedInitialCommit': mapping[start],
    'originalInitialCommitAbsentFromNormalizedRepository': True,
    'sourceProofs': source_proofs,
}
(base / 'normalization-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k:v for k,v in result.items() if k not in ('removedSignatures', 'sourceProofs')}, indent=2))
print('Removed signature headers:', len(removed_signatures))
for proof in source_proofs:
    print(proof['name'], proof['normalizedImportedHead'], proof['normalizedImportCommit'], 'PASS')
