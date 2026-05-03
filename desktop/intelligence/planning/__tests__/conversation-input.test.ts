/**
 * Phase 824 / C08 T8 — Conversation input tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import { createConversationInput } from '../components/conversation-input.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    requestBriefingRefresh: vi.fn().mockResolvedValue({ id: 'req_test' }),
    listProjects: vi.fn().mockResolvedValue([]),
    on: {
      statusUpdate: vi.fn().mockResolvedValue(() => { }),
    },
  },
}));

describe('Conversation input', () => {
  beforeEach(async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.requestBriefingRefresh as ReturnType<typeof vi.fn>).mockClear();
  });

  it('submit non-empty text → IPC call with text in payload', async () => {
    const store = createIntelligenceStore();
    const comp = createConversationInput('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const textarea = div.querySelector('textarea') as HTMLTextAreaElement;
    const sendBtn = div.querySelector('button') as HTMLButtonElement;

    textarea.value = 'What is causing the CAPCOM gate hold?';
    sendBtn.click();

    await new Promise(r => setTimeout(r, 20));

    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    expect(intelligenceIpc.requestBriefingRefresh).toHaveBeenCalledWith(
      'proj-1',
      undefined, // no branch in store for this project
      'What is causing the CAPCOM gate hold?',
    );
    comp.unmount();
  });

  it('submit empty → no-op, IPC not called', async () => {
    const store = createIntelligenceStore();
    const comp = createConversationInput('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const textarea = div.querySelector('textarea') as HTMLTextAreaElement;
    const sendBtn = div.querySelector('button') as HTMLButtonElement;

    textarea.value = '   '; // whitespace-only
    sendBtn.click();

    await new Promise(r => setTimeout(r, 20));

    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    expect(intelligenceIpc.requestBriefingRefresh).not.toHaveBeenCalled();
    comp.unmount();
  });

  it('textarea clears after submit', async () => {
    const store = createIntelligenceStore();
    const comp = createConversationInput('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const textarea = div.querySelector('textarea') as HTMLTextAreaElement;
    const sendBtn = div.querySelector('button') as HTMLButtonElement;

    textarea.value = 'Some input';
    sendBtn.click();

    await new Promise(r => setTimeout(r, 20));

    expect(textarea.value).toBe('');
    comp.unmount();
  });

  it('has accessible aria-label on Send button', () => {
    const store = createIntelligenceStore();
    const comp = createConversationInput('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const btn = div.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBeTruthy();
    comp.unmount();
  });
});
