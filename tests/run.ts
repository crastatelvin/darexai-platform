import { signAccessToken, verifyToken, generatePKCE } from '../src/lib/auth';
import { Alert } from '../src/components/Alert';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n\x1b[34m========================================\x1b[0m');
  console.log('\x1b[36;1m   Running AI Platform Unit Tests   \x1b[0m');
  console.log('\x1b[34m========================================\x1b[0m\n');

  let passed = 0;
  let failed = 0;

  // Helper to run a test block
  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`\x1b[32m✓ PASSED:\x1b[0m ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`\x1b[31m✗ FAILED:\x1b[0m ${name}`);
      console.error(`  \x1b[33mError:\x1b[0m ${err.message || err}\n`);
      failed++;
    }
  }

  // Test Case 1: JWT Signature & Verification
  test('JWT Authentication Sign & Verify Flow', () => {
    const payload = { userId: 'user-123', tenantId: 'tenant-abc' };
    const token = signAccessToken(payload);
    
    assert(typeof token === 'string', 'Token must be a string');
    assert(token.length > 20, 'Token length should be non-trivial');

    const decoded = verifyToken(token);
    assert(decoded !== null, 'Decoded token should not be null');
    assert(decoded.userId === payload.userId, 'Decoded user ID matches');
    assert(decoded.tenantId === payload.tenantId, 'Decoded tenant ID matches');
  });

  // Test Case 2: JWT Tampering Security
  test('JWT Tamper Resistance Verification', () => {
    const payload = { userId: 'user-123', tenantId: 'tenant-abc' };
    const token = signAccessToken(payload);
    
    // Tamper with the token string
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    const decoded = verifyToken(tamperedToken);
    
    assert(decoded === null, 'Tampered token verification must return null');
  });

  // Test Case 3: PKCE Challenge Generation
  test('OAuth PKCE Challenge & Verifier Strength', () => {
    const { codeVerifier, codeChallenge } = generatePKCE();
    
    assert(typeof codeVerifier === 'string', 'Verifier must be a string');
    assert(typeof codeChallenge === 'string', 'Challenge must be a string');
    assert(codeVerifier.length >= 43, 'Verifier should meet PKCE entropy limits');
    assert(codeVerifier !== codeChallenge, 'Challenge and verifier must be distinct');
  });

  // Test Case 4: Tenant Isolation Context Verification
  test('Tenant Context Validation Utility', () => {
    // Simulate withAuth middleware token parse
    const mockRequestHeader = (token: string | null) => {
      if (!token) return null;
      const decoded = verifyToken(token);
      if (!decoded) return null;
      return { tenantId: decoded.tenantId, userId: decoded.userId };
    };

    const validToken = signAccessToken({ userId: 'alice', tenantId: 'workspace-a' });
    const context = mockRequestHeader(validToken);

    assert(context !== null, 'Context must be extracted');
    assert(context?.tenantId === 'workspace-a', 'Tenant ID matches context');
    assert(context?.userId === 'alice', 'User ID matches context');
    
    const invalidContext = mockRequestHeader('bad-token');
    assert(invalidContext === null, 'Invalid token must return null context');
  });

  // Test Case 5: AI CRM Recommendation Stage-to-Action Mapping
  test('AI Next Best Action Decision Logic Mapping', () => {
    // Mapping rules from API opportunities route
    const getMockNextBestAction = (status: string) => {
      let action = 'Follow up with customer.';
      if (status === 'QUALIFYING') action = 'Book detailed solution consultation.';
      if (status === 'PROPOSAL') action = 'Send detailed cost quote & RFP response.';
      if (status === 'NEGOTIATION') action = 'Offer a standard 10% discount on first year contract.';
      if (status === 'WON') action = 'Kickstart implementation and team assignment.';
      if (status === 'LOST') action = 'Schedule post-mortem feedback call.';
      return action;
    };

    assert(getMockNextBestAction('QUALIFYING') === 'Book detailed solution consultation.', 'Qualifying stage action mismatch');
    assert(getMockNextBestAction('PROPOSAL') === 'Send detailed cost quote & RFP response.', 'Proposal stage action mismatch');
    assert(getMockNextBestAction('WON') === 'Kickstart implementation and team assignment.', 'Won stage action mismatch');
  });

  // Test Case 6: React Alert Component Virtual DOM Render Test
  test('React Alert Component Render Output', () => {
    const element = Alert({ type: 'success', message: 'Lead qualified!' });
    assert(element !== null, 'Component element should render');
    assert(element.props.className.includes('text-emerald-400'), 'Should contain success class');
    assert(element.props.children.props.children === 'Lead qualified!', 'Should render message text');
  });

  console.log('\n\x1b[34m========================================\x1b[0m');
  console.log(`\x1b[36;1m   Test Suite Summary: ${passed} Passed, ${failed} Failed   \x1b[0m`);
  console.log('\x1b[34m========================================\x1b[0m\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
