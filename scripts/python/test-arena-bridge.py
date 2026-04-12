#!/usr/bin/env python3
"""
Stdlib-only test script for the research-coprocessor-bridge.py `arena`
subcommand (P3A).

Runs the bridge as a subprocess for each op and asserts against the
JSON responses. Uses only subprocess / json / base64 / hashlib / tempfile
/ os — no pytest dependency. Exit code is non-zero on any failure.

Run:
    python3 test-arena-bridge.py
"""

import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile


BRIDGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'research-coprocessor-bridge.py')


# ─── Test harness ────────────────────────────────────────────────────────────

_passed = 0
_failed = 0
_failures: list = []


def assert_eq(label, got, expected):
    global _passed, _failed
    if got == expected:
        _passed += 1
        print(f"  ✓ {label}")
    else:
        _failed += 1
        _failures.append(f"{label}: expected {expected!r}, got {got!r}")
        print(f"  ✗ {label}: expected {expected!r}, got {got!r}")


def assert_true(label, cond, msg=""):
    global _passed, _failed
    if cond:
        _passed += 1
        print(f"  ✓ {label}")
    else:
        _failed += 1
        _failures.append(f"{label}: {msg}")
        print(f"  ✗ {label}: {msg}")


def run_arena(db_path: str, *args):
    """Run the bridge's arena subcommand. Returns the parsed JSON response."""
    cmd = ['python3', BRIDGE, 'arena', '--db', db_path] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 and not result.stdout:
        raise RuntimeError(
            f"bridge failed: {' '.join(cmd)}\nstdout: {result.stdout}\nstderr: {result.stderr}"
        )
    # The JSON is always the last line of stdout (bridge is single-line JSON on arena ops).
    lines = [l for l in result.stdout.strip().splitlines() if l.strip()]
    if not lines:
        raise RuntimeError(f"no output from bridge: {' '.join(cmd)}\nstderr: {result.stderr}")
    return json.loads(lines[-1])


# ─── Test cases ──────────────────────────────────────────────────────────────

def test_stats_empty(db):
    print("test_stats_empty")
    r = run_arena(db, 'stats')
    assert_eq('ok', r['ok'], True)
    assert_eq('total_entries', r['total_entries'], 0)
    assert_eq('total_bytes', r['total_bytes'], 0)
    assert_eq('by_tier', r['by_tier'], {})


def test_put_text_then_get(db):
    print("test_put_text_then_get")
    put = run_arena(db, 'put', '--payload-text', 'hello arena')
    expected_hash = hashlib.sha256(b'hello arena').hexdigest()
    assert_eq('put.ok', put['ok'], True)
    assert_eq('put.hash', put['hash'], expected_hash)
    assert_eq('put.created', put['created'], True)
    assert_eq('put.tier', put['tier'], 'blob')

    got = run_arena(db, 'get', '--hash-hex', expected_hash)
    assert_eq('get.ok', got['ok'], True)
    assert_eq('get.found', got['found'], True)
    assert_eq('get.hash', got['hash'], expected_hash)
    assert_eq('get.size', got['size'], 11)
    decoded = base64.b64decode(got['payload_base64']).decode('utf-8')
    assert_eq('get.decoded', decoded, 'hello arena')


def test_put_is_idempotent(db):
    print("test_put_is_idempotent")
    first = run_arena(db, 'put', '--payload-text', 'same-content')
    second = run_arena(db, 'put', '--payload-text', 'same-content')
    assert_eq('first.hash == second.hash', first['hash'], second['hash'])
    assert_eq('first.created', first['created'], True)
    assert_eq('second.created', second['created'], False)


def test_put_distinct_payloads_distinct_hashes(db):
    print("test_put_distinct_payloads_distinct_hashes")
    a = run_arena(db, 'put', '--payload-text', 'alpha-payload')
    b = run_arena(db, 'put', '--payload-text', 'bravo-payload')
    assert_true('distinct hashes', a['hash'] != b['hash'], 'hashes collided')


def test_put_with_explicit_hash(db):
    print("test_put_with_explicit_hash")
    r = run_arena(db, 'put', '--hash-hex', 'deadbeef', '--payload-text', 'x')
    assert_eq('put.hash', r['hash'], 'deadbeef')
    got = run_arena(db, 'get', '--hash-hex', 'DEADBEEF')  # mixed case must canonicalize
    assert_eq('get.found', got['found'], True)
    decoded = base64.b64decode(got['payload_base64']).decode('utf-8')
    assert_eq('get.decoded', decoded, 'x')


def test_put_via_base64(db):
    print("test_put_via_base64")
    raw = b'\x00\x01\x02\x03\xff\xfe\xfd'
    b64 = base64.b64encode(raw).decode('ascii')
    put = run_arena(db, 'put', '--payload-base64', b64)
    got = run_arena(db, 'get', '--hash-hex', put['hash'])
    decoded = base64.b64decode(got['payload_base64'])
    assert_eq('roundtrip bytes', decoded, raw)
    assert_eq('roundtrip size', got['size'], len(raw))


def test_put_via_file(db):
    print("test_put_via_file")
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b'from-file-contents')
        path = f.name
    try:
        put = run_arena(db, 'put', '--payload-file', path)
        expected = hashlib.sha256(b'from-file-contents').hexdigest()
        assert_eq('file.hash', put['hash'], expected)
    finally:
        os.unlink(path)


def test_has(db):
    print("test_has")
    run_arena(db, 'put', '--hash-hex', 'abcd', '--payload-text', 'present')
    yes = run_arena(db, 'has', '--hash-hex', 'abcd')
    no = run_arena(db, 'has', '--hash-hex', 'ef01')
    assert_eq('has present', yes['has'], True)
    assert_eq('has absent', no['has'], False)


def test_remove(db):
    print("test_remove")
    run_arena(db, 'put', '--hash-hex', '1234', '--payload-text', 'goner')
    rm = run_arena(db, 'remove', '--hash-hex', '1234')
    assert_eq('removed', rm['removed'], True)
    after = run_arena(db, 'has', '--hash-hex', '1234')
    assert_eq('has after remove', after['has'], False)

    # Remove again → false
    rm2 = run_arena(db, 'remove', '--hash-hex', '1234')
    assert_eq('removed twice', rm2['removed'], False)


def test_list(db):
    print("test_list")
    run_arena(db, 'put', '--hash-hex', '01', '--payload-text', 'a')
    run_arena(db, 'put', '--hash-hex', '02', '--payload-text', 'b')
    run_arena(db, 'put', '--hash-hex', '03', '--payload-text', 'c')
    lst = run_arena(db, 'list')
    # These three are a subset — earlier tests may have added more.
    for h in ('01', '02', '03'):
        assert_true(f'list contains {h}', h in lst['hashes'], f'{h} missing from {lst["hashes"]}')
    assert_true('count matches len', lst['count'] == len(lst['hashes']), 'count mismatch')


def test_stats_populated(db):
    print("test_stats_populated")
    stats = run_arena(db, 'stats')
    assert_eq('ok', stats['ok'], True)
    assert_true('has entries', stats['total_entries'] > 0, 'no entries after puts')
    assert_true('has bytes', stats['total_bytes'] > 0, 'zero bytes after puts')
    assert_true("blob tier present", 'blob' in stats['by_tier'], 'no blob tier in stats')


def test_replace(db):
    print("test_replace")
    run_arena(db, 'put', '--hash-hex', '77', '--payload-text', 'v1')
    run_arena(db, 'replace', '--hash-hex', '77', '--payload-text', 'v2')
    got = run_arena(db, 'get', '--hash-hex', '77')
    decoded = base64.b64decode(got['payload_base64']).decode('utf-8')
    assert_eq('replaced content', decoded, 'v2')


def test_preload(db):
    print("test_preload")
    run_arena(db, 'put', '--hash-hex', 'aa', '--payload-text', 'a')
    run_arena(db, 'put', '--hash-hex', 'bb', '--payload-text', 'b')
    result = run_arena(db, 'preload', 'aa', 'bb', 'cc')  # cc is missing
    assert_eq('preload.ok', result['ok'], True)
    assert_eq('preload.hits', result['hits'], 2)
    assert_eq('preload.requested', result['requested'], 3)


def test_error_paths(db):
    print("test_error_paths")
    # Get a missing hash → found: false, not an error.
    got = run_arena(db, 'get', '--hash-hex', '99999999')
    assert_eq('missing get.ok', got['ok'], True)
    assert_eq('missing get.found', got['found'], False)

    # Put with no payload arg — the runner will raise from the bridge.
    r = run_arena(db, 'put', '--hash-hex', 'ff')
    assert_eq('put-no-payload.ok', r['ok'], False)
    assert_true('error message present', 'error' in r, 'error field missing')


def test_invalid_hex_rejected(db):
    print("test_invalid_hex_rejected")
    r = run_arena(db, 'has', '--hash-hex', 'not-hex')
    assert_eq('invalid-hex.ok', r['ok'], False)
    assert_true('error field', 'error' in r, 'error field missing')


# ─── Runner ──────────────────────────────────────────────────────────────────

def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        db = os.path.join(tmpdir, 'test-arena.sqlite')
        test_stats_empty(db)
        test_put_text_then_get(db)
        test_put_is_idempotent(db)
        test_put_distinct_payloads_distinct_hashes(db)
        test_put_with_explicit_hash(db)
        test_put_via_base64(db)
        test_put_via_file(db)
        test_has(db)
        test_remove(db)
        test_list(db)
        test_stats_populated(db)
        test_replace(db)
        test_preload(db)
        test_error_paths(db)
        test_invalid_hex_rejected(db)

    print()
    print(f"RESULTS: {_passed} passed, {_failed} failed")
    if _failed > 0:
        print("\nFailures:")
        for f in _failures:
            print(f"  - {f}")
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
