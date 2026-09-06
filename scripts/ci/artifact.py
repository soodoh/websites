"""Version-1 local CI artifacts. Integrity is not production authorization."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SITES = ("paul", "diloreto")
FIELDS = ("schemaVersion", "repository", "site", "commit", "workflow", "runId", "runAttempt", "artifactName", "releaseId", "event", "ref", "releaseAuthorized")
FORBIDDEN = re.compile(r"(^|/)(?:\.env[^/]*|\.aws|node_modules|project-auth-manifest\.json|\.git)(/|$)|\.(?:pem|key)$", re.I)
EXTENSIONS = {".html", ".css", ".js", ".json", ".txt", ".xml", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".pdf", ".mp4", ".webm", ".md", ".zip"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def scan(name, data, nested=False):
    parts = name.split("/")
    if name.startswith("/") or ".." in parts or "\\" in name or FORBIDDEN.search(name):
        raise ValueError("Forbidden artifact path")
    suffix = Path(name).suffix.lower()
    if suffix not in EXTENSIONS:
        raise ValueError("Unapproved artifact file type")
    if re.search(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:AKIA|ASIA)[A-Z0-9]{16}", data):
        raise ValueError("Credential-shaped artifact content")
    # Scan exact sensitive values if the caller mistakenly supplied credentials.
    for key, value in os.environ.items():
        if re.search(r"TOKEN|SECRET|PASSWORD|ACCESS_KEY", key) and len(value) >= 12 and value.encode() in data:
            raise ValueError("Sensitive environment value in artifact")
    if suffix == ".zip":
        if nested:
            raise ValueError("Nested diagnostic archive")
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                # Playwright trace resources use extensionless hashes and trace/network files.
                trace_name = info.filename
                if Path(trace_name).suffix in {"", ".trace", ".network", ".stacks"}:
                    trace_name += ".txt"
                scan(trace_name, archive.read(info), True)


def files(directory):
    if directory.is_symlink():
        raise ValueError("Symlink artifact directory")
    result = {}
    for path in sorted(directory.rglob("*")):
        if path.is_symlink():
            raise ValueError("Symlink in artifact")
        if path.is_file():
            name = path.relative_to(directory).as_posix()
            data = path.read_bytes()
            scan(name, data)
            result[name] = data
    return result


def identity(site):
    if site not in SITES:
        raise ValueError("Not a static site")
    commit = subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()
    if not re.fullmatch(r"[0-9a-f]{40}", commit) or os.environ.get("GITHUB_SHA", commit) != commit:
        raise ValueError("Checkout identity mismatch")
    repository = os.environ["GITHUB_REPOSITORY"]
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository):
        raise ValueError("Invalid repository")
    run, attempt = os.environ["GITHUB_RUN_ID"], os.environ["GITHUB_RUN_ATTEMPT"]
    if not all(re.fullmatch(r"[1-9][0-9]*", value) for value in (run, attempt)):
        raise ValueError("Invalid build run/attempt")
    release_id = f"{site}-{run}-{attempt}"
    return dict(schemaVersion=1, repository=repository, site=site, commit=commit,
                workflow=".github/workflows/ci.yml", runId=run, runAttempt=attempt,
                artifactName=f"{release_id}-static", releaseId=release_id,
                event=os.environ["GITHUB_EVENT_NAME"], ref=os.environ["GITHUB_REF"],
                releaseAuthorized=False)


def verify(directory, expected):
    metadata = json.loads((directory / "metadata.json").read_text())
    if set(metadata) != set(FIELDS) | {"sha256", "deploymentRoot"} or metadata.get("deploymentRoot") != "dist/client":
        raise ValueError("Invalid metadata schema")
    for key in FIELDS:
        if metadata.get(key) != expected.get(key) or key not in expected:
            raise ValueError(f"Provenance mismatch: {key}")
    if metadata["schemaVersion"] != 1 or metadata["site"] not in SITES or metadata["releaseAuthorized"] is not False:
        raise ValueError("Unsupported CI artifact")
    data = (directory / "site.zip").read_bytes()
    checksum = digest(data)
    if checksum != metadata["sha256"] or (directory / "site.zip.sha256").read_text() != f"{checksum}  site.zip\n":
        raise ValueError("Checksum mismatch")
    if expected.get("sha256", checksum) != checksum:
        raise ValueError("Expected checksum mismatch")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        if len(set(names)) != len(names) or any(name.startswith(("dist/", "client/", "apps/")) for name in names):
            raise ValueError("Invalid zip root")
        required = {"index.html", "404.html", "release.json"}
        if metadata["site"] == "diloreto":
            required.add("areyou/index.html")
        if not required.issubset(names) or archive.testzip() is not None:
            raise ValueError("Incomplete archive")
        for name in names:
            scan(name, archive.read(name))
        marker = json.loads(archive.read("release.json"))
        if marker != {key: metadata[key] for key in FIELDS}:
            raise ValueError("Release marker mismatch")
    return metadata


def package(site):
    expected = identity(site)
    source = ROOT / "apps" / site / "dist/client"
    content = files(source)
    if json.loads(content["release.json"]) != expected:
        raise ValueError("Marker was not built for this run")
    destination = ROOT / "ci-artifacts" / site / "static"
    destination.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(destination / "site.zip", "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in content.items():
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    checksum = digest((destination / "site.zip").read_bytes())
    (destination / "site.zip.sha256").write_text(f"{checksum}  site.zip\n")
    (destination / "metadata.json").write_text(json.dumps({**expected, "sha256": checksum, "deploymentRoot": "dist/client"}, indent=2) + "\n")
    verify(destination, expected)
    # Packaging must not mutate any byte of already browser-validated output.
    if files(source) != content:
        raise ValueError("Validated output changed during packaging")


def diagnostics(site):
    if site not in ("sarabeth", "carolyn", *SITES):
        raise ValueError("Unknown app")
    roots = ["test-results", "playwright-report"]
    if site == "paul":
        roots.append(".lighthouseci/reports")
    destination = ROOT / "ci-artifacts" / site / "diagnostics"
    destination.mkdir(parents=True, exist_ok=False)
    for name in roots:
        source = ROOT / "apps" / site / name
        if not source.exists():
            continue
        for relative, data in files(source).items():
            target = destination / name.replace(".lighthouseci/", "lighthouse/") / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    (destination / "classification.json").write_text(json.dumps({"site": site, "kind": "hermetic-fixture-diagnostics", "deployable": False}) + "\n")


if __name__ == "__main__":
    command, site = sys.argv[1:3]
    if command == "marker":
        if os.environ.get("CI_RELEASE_METADATA") == "1":
            (ROOT / "apps" / site / "dist/client/release.json").write_text(json.dumps(identity(site), indent=2) + "\n")
    elif command == "package":
        package(site)
    elif command == "diagnostics":
        diagnostics(site)
    elif command == "verify":
        verify(Path(site), json.loads(Path(sys.argv[3]).read_text()))
    else:
        raise ValueError("Unknown artifact command")
