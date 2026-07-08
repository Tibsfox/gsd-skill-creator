import { describe, it, expect } from 'vitest';
import * as toolsBarrel from './index.js';
import * as gatewayBarrel from '../index.js';

// The superseded narrow gateway factory (registerAllTools /
// createGatewayServerFactory) was removed in favor of the production
// createGsdGatewayFactory. Guard against re-introduction. (MEM-8)
describe('gateway barrels (MEM-8)', () => {
  it('tools barrel dropped the superseded narrow factory but keeps domain registrations', () => {
    expect(toolsBarrel).not.toHaveProperty('registerAllTools');
    expect(toolsBarrel).not.toHaveProperty('createGatewayServerFactory');
    expect(toolsBarrel).toHaveProperty('registerMemoryTools');
  });

  it('gateway barrel exports the production factory, not the removed narrow one', () => {
    expect(gatewayBarrel).toHaveProperty('createGsdGatewayFactory');
    expect(gatewayBarrel).not.toHaveProperty('createGatewayServerFactory');
    expect(gatewayBarrel).not.toHaveProperty('registerAllTools');
  });
});
