/**
 * Tests for the v1.49.650 keystore passphrase-flow state machine.
 */

import { describe, it, expect, vi } from 'vitest';
import { PassphraseFlow } from './passphrase-flow';

function makeFlow(submitFn: (p: string) => Promise<void> = async () => {}) {
  return new PassphraseFlow(submitFn);
}

describe('PassphraseFlow — initial state', () => {
  it('starts in "entering" with empty passphrase and matching validation error', () => {
    const flow = makeFlow();
    const snap = flow.snapshot();
    expect(snap.state).toBe('entering');
    expect(snap.validationError).toBe('enter a passphrase');
    expect(snap.canSubmit).toBe(false);
    expect(snap.submitError).toBeNull();
  });
});

describe('PassphraseFlow — validation', () => {
  it('reports "confirm your passphrase" when only the primary field is set', () => {
    const flow = makeFlow();
    flow.setPassphrase('hunter2');
    expect(flow.snapshot().validationError).toBe('confirm your passphrase');
    expect(flow.snapshot().canSubmit).toBe(false);
  });

  it('reports "passphrases do not match" when fields differ', () => {
    const flow = makeFlow();
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter3');
    expect(flow.snapshot().validationError).toBe('passphrases do not match');
    expect(flow.snapshot().canSubmit).toBe(false);
  });

  it('allows submit when both fields match and are non-empty', () => {
    const flow = makeFlow();
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    expect(flow.snapshot().validationError).toBeNull();
    expect(flow.snapshot().canSubmit).toBe(true);
  });
});

describe('PassphraseFlow — submit', () => {
  it('calls submitFn with the passphrase on success path', async () => {
    const submitFn = vi.fn().mockResolvedValue(undefined);
    const flow = makeFlow(submitFn);
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    await flow.submit();
    expect(submitFn).toHaveBeenCalledWith('hunter2');
    expect(flow.snapshot().state).toBe('success');
    expect(flow.snapshot().submitError).toBeNull();
  });

  it('transitions to "error" with a string error when submitFn rejects', async () => {
    const flow = makeFlow(() => Promise.reject('invalid passphrase'));
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    await flow.submit();
    const snap = flow.snapshot();
    expect(snap.state).toBe('error');
    expect(snap.submitError).toBe('invalid passphrase');
  });

  it('uses Error.message when submitFn rejects with an Error', async () => {
    const flow = makeFlow(() => Promise.reject(new Error('decrypt failed')));
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    await flow.submit();
    expect(flow.snapshot().submitError).toBe('decrypt failed');
  });

  it('does nothing when validation fails', async () => {
    const submitFn = vi.fn();
    const flow = makeFlow(submitFn);
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter3'); // mismatch
    await flow.submit();
    expect(submitFn).not.toHaveBeenCalled();
    expect(flow.snapshot().state).toBe('entering');
  });

  it('is a no-op when a submit is already in flight', async () => {
    let resolveFn: (() => void) | null = null;
    const submitFn = vi.fn(
      () => new Promise<void>((resolve) => { resolveFn = resolve; }),
    );
    const flow = makeFlow(submitFn);
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    const first = flow.submit();
    expect(flow.snapshot().state).toBe('submitting');
    await flow.submit(); // re-entry attempt — must not call submitFn again
    expect(submitFn).toHaveBeenCalledTimes(1);
    resolveFn!();
    await first;
    expect(flow.snapshot().state).toBe('success');
  });
});

describe('PassphraseFlow — edit clears prior submit-error', () => {
  it('clears submitError + drops state back to "entering" on next edit', async () => {
    const flow = makeFlow(() => Promise.reject('first try failed'));
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    await flow.submit();
    expect(flow.snapshot().state).toBe('error');
    flow.setPassphrase('hunter3');
    const snap = flow.snapshot();
    expect(snap.state).toBe('entering');
    expect(snap.submitError).toBeNull();
  });
});

describe('PassphraseFlow — reset', () => {
  it('clears all fields and returns to initial state', () => {
    const flow = makeFlow();
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    flow.reset();
    const snap = flow.snapshot();
    expect(snap.state).toBe('entering');
    expect(snap.validationError).toBe('enter a passphrase');
    expect(snap.submitError).toBeNull();
  });
});

describe('PassphraseFlow — onChange subscriptions', () => {
  it('notifies listeners on every state change', () => {
    const flow = makeFlow();
    const listener = vi.fn();
    flow.onChange(listener);
    flow.setPassphrase('hunter2');
    flow.setConfirm('hunter2');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1]?.[0].canSubmit).toBe(true);
  });

  it('returns an unsubscribe function that stops notifications', () => {
    const flow = makeFlow();
    const listener = vi.fn();
    const unsubscribe = flow.onChange(listener);
    flow.setPassphrase('x');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    flow.setPassphrase('xy');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
