/**
 * IPC command wrapper contract tests.
 *
 * Verifies that all 9 planned Tauri command wrappers exist in the desktop
 * IPC module and invoke the correct Tauri command name strings with correct
 * argument shapes. Uses vi.hoisted + vi.mock to intercept @tauri-apps/api/core
 * invoke calls across the desktop/root module boundary.
 *
 * @module tests/ipc-commands
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs before vi.mock hoisting, making mockInvoke available
// to the vi.mock factory functions below.
const { mockInvoke } = vi.hoisted(() => {
  return { mockInvoke: vi.fn() };
});

// Mock the Tauri core module using the absolute path that desktop resolves to.
// vi.mock is hoisted, so we inline the path computation.
vi.mock(
  new URL('../../../desktop/node_modules/@tauri-apps/api/core', import.meta.url).pathname,
  () => ({ invoke: mockInvoke }),
);

// Mock the Tauri event module (needed for event listener imports in commands.test.ts)
vi.mock(
  new URL('../../../desktop/node_modules/@tauri-apps/api/event', import.meta.url).pathname,
  () => ({ listen: vi.fn() }),
);

// Import the desktop command wrappers
import {
  sendChatMessage,
  getServiceStates,
  setMagicLevel,
  getMagicLevel,
  getConversationHistory,
  startService,
  stopService,
  restartService,
  getStagingStatus,
} from '../../../desktop/src/ipc/commands';

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('IPC command wrappers', () => {
  describe('sendChatMessage', () => {
    it('exists and is a function', () => {
      expect(typeof sendChatMessage).toBe('function');
    });

    it('invokes send_chat_message with message and optional conversation_id', async () => {
      mockInvoke.mockResolvedValue({ conversation_id: 'abc-123' });
      const result = await sendChatMessage('Hello', 'conv-1');
      expect(mockInvoke).toHaveBeenCalledWith('send_chat_message', {
        message: 'Hello',
        conversation_id: 'conv-1',
      });
      expect(result).toEqual({ conversation_id: 'abc-123' });
    });

    it('passes undefined conversation_id when not provided', async () => {
      mockInvoke.mockResolvedValue({ conversation_id: 'new-conv' });
      await sendChatMessage('Test');
      expect(mockInvoke).toHaveBeenCalledWith('send_chat_message', {
        message: 'Test',
        conversation_id: undefined,
      });
    });
  });

  describe('getServiceStates', () => {
    it('exists and is a function', () => {
      expect(typeof getServiceStates).toBe('function');
    });

    it('invokes get_service_states with no arguments', async () => {
      const mockStates = [{ service_id: 'svc-1', status: 'online', led_color: '#00ff00' }];
      mockInvoke.mockResolvedValue(mockStates);
      const result = await getServiceStates();
      expect(mockInvoke).toHaveBeenCalledWith('get_service_states');
      expect(result).toEqual(mockStates);
    });
  });

  describe('setMagicLevel', () => {
    it('exists and is a function', () => {
      expect(typeof setMagicLevel).toBe('function');
    });

    it('invokes set_magic_level with level argument', async () => {
      mockInvoke.mockResolvedValue({ level: 4, previous_level: 3 });
      const result = await setMagicLevel(4);
      expect(mockInvoke).toHaveBeenCalledWith('set_magic_level', { level: 4 });
      expect(result).toEqual({ level: 4, previous_level: 3 });
    });
  });

  describe('getMagicLevel', () => {
    it('exists and is a function', () => {
      expect(typeof getMagicLevel).toBe('function');
    });

    it('invokes get_magic_level with no arguments', async () => {
      mockInvoke.mockResolvedValue({ level: 3 });
      const result = await getMagicLevel();
      expect(mockInvoke).toHaveBeenCalledWith('get_magic_level');
      expect(result).toEqual({ level: 3 });
    });
  });

  describe('getConversationHistory', () => {
    it('exists and is a function', () => {
      expect(typeof getConversationHistory).toBe('function');
    });

    it('invokes get_conversation_history with conversation_id', async () => {
      const mockHistory = { messages: [{ role: 'user', content: 'Hi' }] };
      mockInvoke.mockResolvedValue(mockHistory);
      const result = await getConversationHistory('conv-1');
      expect(mockInvoke).toHaveBeenCalledWith('get_conversation_history', {
        conversation_id: 'conv-1',
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('startService', () => {
    it('exists and is a function', () => {
      expect(typeof startService).toBe('function');
    });

    it('invokes start_service with service_id', async () => {
      mockInvoke.mockResolvedValue({ ok: true });
      const result = await startService('svc-1');
      expect(mockInvoke).toHaveBeenCalledWith('start_service', { service_id: 'svc-1' });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('stopService', () => {
    it('exists and is a function', () => {
      expect(typeof stopService).toBe('function');
    });

    it('invokes stop_service with service_id', async () => {
      mockInvoke.mockResolvedValue({ ok: true });
      const result = await stopService('svc-1');
      expect(mockInvoke).toHaveBeenCalledWith('stop_service', { service_id: 'svc-1' });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('restartService', () => {
    it('exists and is a function', () => {
      expect(typeof restartService).toBe('function');
    });

    it('invokes restart_service with service_id', async () => {
      mockInvoke.mockResolvedValue({ ok: true });
      const result = await restartService('svc-1');
      expect(mockInvoke).toHaveBeenCalledWith('restart_service', { service_id: 'svc-1' });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('getStagingStatus', () => {
    it('exists and is a function', () => {
      expect(typeof getStagingStatus).toBe('function');
    });

    it('invokes get_staging_status with no arguments', async () => {
      const mockStatus = { intake_count: 2, processing_count: 1, quarantine_count: 0 };
      mockInvoke.mockResolvedValue(mockStatus);
      const result = await getStagingStatus();
      expect(mockInvoke).toHaveBeenCalledWith('get_staging_status');
      expect(result).toEqual(mockStatus);
    });
  });
});
