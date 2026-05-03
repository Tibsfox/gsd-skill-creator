/**
 * Conversation input — textarea + Send button.
 * Sends console request via IPC (does NOT make direct AI calls).
 * Phase 824 / C08 T8.
 */

import type { ProjectId } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

export function createConversationInput(
  projectId: ProjectId,
  store: Store<IntelligenceStore>,
): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let container: HTMLElement | null = null;

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'conversation-input';

    const textarea = document.createElement('textarea');
    textarea.className = 'conversation-textarea';
    textarea.placeholder = 'Talk through with AI…';
    textarea.rows = 2;
    textarea.setAttribute('aria-label', 'Send a message to the AI investigator');

    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.textContent = 'Send';
    sendBtn.setAttribute('aria-label', 'Send message');

    const handleSend = async () => {
      const text = textarea.value.trim();
      if (!text) return;
      textarea.value = '';
      try {
        const branch = store.get().projects.find(p => p.id === projectId)?.branch;
        await intelligenceIpc.requestBriefingRefresh(projectId, branch, text);
      } catch {
        // Stub rejection in Phase 824 — silently ignored (console request path)
      }
    };

    sendBtn.addEventListener('click', handleSend);
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    });

    container.appendChild(textarea);
    container.appendChild(sendBtn);
    parent.appendChild(container);
  }

  function unmount() {
    container?.remove();
    container = null;
  }

  return { mount, unmount };
}
