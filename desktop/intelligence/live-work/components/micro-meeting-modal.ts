/**
 * Micro-meeting modal component.
 * Phase 824 / C09 T5.
 *
 * Opens as a <dialog> overlay when "Address ↗" is clicked on a blocked decision.
 * Offers Clear / Escalate / Dismiss actions.
 */

import type { InFlightDecision } from '../types.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

type ModalAction = 'clear' | 'escalate' | 'dismiss';

export interface AddressBlockedRequest {
  id: string;
  type: 'intelligence.address_blocked_decision';
  decision_id: string;
  action: ModalAction;
  rationale?: string;
}

function generateRequestId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `req_${dateStr}_${timeStr}_${rand}`;
}

export interface MicroMeetingModalComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  open(): void;
  close(): void;
}

export function createMicroMeetingModal(
  decision: InFlightDecision,
  onRequest?: (req: AddressBlockedRequest) => void,
): MicroMeetingModalComponent {
  let dialogEl: HTMLDialogElement | null = null;
  let selectedAction: ModalAction = 'clear';
  let dismissRationale = '';

  function handleSend(): void {
    if (selectedAction === 'escalate') {
      // Escalate: start a new planning meeting
      // Use snap-1 as a placeholder snapshot id (real KB would provide this)
      intelligenceIpc.startMeeting(decision.project_id, 'snap-1').catch(() => null);
      closeModal();
      return;
    }

    const req: AddressBlockedRequest = {
      id: generateRequestId(),
      type: 'intelligence.address_blocked_decision',
      decision_id: decision.id,
      action: selectedAction,
      ...(selectedAction === 'dismiss' ? { rationale: dismissRationale } : {}),
    };

    if (onRequest) onRequest(req);
    closeModal();
  }

  function closeModal(): void {
    if (dialogEl) {
      dialogEl.removeAttribute('open');
    }
  }

  function render(): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'micro-meeting-modal';

    const findings = decision.block_findings ?? [];
    const findingsList = findings.length > 0
      ? `<ul class="blocking-findings">${findings.map(f => `<li>${f}</li>`).join('')}</ul>`
      : '<p class="no-findings">No specific findings</p>';

    dialog.innerHTML = `
      <div class="modal-header">
        <h3>Address blocked decision</h3>
      </div>
      <div class="modal-body">
        <p class="modal-decision-title"><strong>Decision:</strong> ${decision.title}</p>
        <div class="modal-block-reason">
          <strong>Block reason:</strong>
          <p>${decision.block_reason ?? 'No reason provided'}</p>
        </div>
        <div class="modal-findings">
          <strong>Findings:</strong>
          ${findingsList}
        </div>
        <div class="modal-actions-choice">
          <p><strong>How would you like to proceed?</strong></p>
          <label class="modal-radio-label">
            <input type="radio" name="modal-action" value="clear" checked>
            Clear gate, proceed to Wave N completion
          </label>
          <label class="modal-radio-label">
            <input type="radio" name="modal-action" value="escalate">
            Escalate to full planning meeting
          </label>
          <label class="modal-radio-label">
            <input type="radio" name="modal-action" value="dismiss">
            Dismiss with rationale:
            <span class="dismiss-rationale-wrapper" style="display:none">
              <input type="text" class="dismiss-rationale-input" placeholder="Enter rationale..." aria-label="Dismiss rationale">
            </span>
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-cancel-btn" type="button">Cancel</button>
        <button class="modal-send-btn" type="button">Send response ↗</button>
      </div>
    `;

    // Wire action radio buttons
    const radios = dialog.querySelectorAll<HTMLInputElement>('input[name="modal-action"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          selectedAction = radio.value as ModalAction;
          // Show/hide dismiss rationale input
          const rationaleWrapper = dialog.querySelector('.dismiss-rationale-wrapper') as HTMLElement;
          rationaleWrapper.style.display = selectedAction === 'dismiss' ? 'inline' : 'none';
        }
      });
    });

    // Wire dismiss rationale input
    const rationaleInput = dialog.querySelector('.dismiss-rationale-input') as HTMLInputElement;
    rationaleInput.addEventListener('input', () => {
      dismissRationale = rationaleInput.value;
    });

    // Wire cancel
    dialog.querySelector('.modal-cancel-btn')?.addEventListener('click', () => {
      closeModal();
    });

    // Wire send
    dialog.querySelector('.modal-send-btn')?.addEventListener('click', () => {
      handleSend();
    });

    // Escape key closes
    dialog.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    return dialog;
  }

  return {
    mount(parent: HTMLElement): void {
      dialogEl = render();
      parent.appendChild(dialogEl);
    },

    unmount(): void {
      dialogEl?.parentElement?.removeChild(dialogEl);
      dialogEl = null;
    },

    open(): void {
      if (dialogEl) {
        // Reset state
        selectedAction = 'clear';
        dismissRationale = '';
        dialogEl.setAttribute('open', '');
        // Focus the dialog for keyboard accessibility
        dialogEl.focus();
      }
    },

    close(): void {
      closeModal();
    },
  };
}
