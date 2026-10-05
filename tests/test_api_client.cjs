/* Deterministic transport tests; no server, credentials or external network. */
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  let respond, last;
  const sandbox = {MemeMap: {}, Headers, fetch: async (...args) => {last = args; return respond();}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/api.js'), 'utf8'), sandbox);
  let unauthorized = 0;
  const api = sandbox.MemeMap.createApiClient({baseUrl: 'https://example.invalid/', credentials: 'include',
    onUnauthorized: () => unauthorized++});
  respond = () => new Response(JSON.stringify({saved: true}), {status: 201});
  assert.equal((await api.request('/api/pins', {method: 'POST', json: {title: 'Test'}})).saved, true);
  assert.equal(last[0], 'https://example.invalid/api/pins');
  assert.equal(last[1].credentials, 'include');
  assert.equal(last[1].headers.get('Content-Type'), 'application/json');
  assert.deepEqual(JSON.parse(last[1].body), {title: 'Test'});
  respond = () => new Response(JSON.stringify({error: 'post_restricted', until: 123, reason: 'test'}), {status: 403});
  await assert.rejects(api.request('/api/pins'), error => error.status === 403 && error.code === 'post_restricted'
    && error.data.until === 123 && error.data.reason === 'test');
  respond = () => new Response(JSON.stringify({error: 'invalid_credentials'}), {status: 401});
  await assert.rejects(api.request('/api/login'), error => error.code === 'invalid_credentials');
  assert.equal(unauthorized, 0);
  respond = () => new Response(JSON.stringify({error: 'authentication_required'}), {status: 401});
  await assert.rejects(api.request('/api/pins'), error => error.status === 401);
  assert.equal(unauthorized, 1);
  respond = () => new Response('<html>Upstream failed</html>', {status: 502});
  await assert.rejects(api.request('/api/pins'), error => error.code === 'invalid_response' && error.status === 502);
  respond = () => {throw new TypeError('network');};
  await assert.rejects(api.request('/api/me'), error => error.code === 'network_error' && error.status === 0);
  const abort = new DOMException('aborted', 'AbortError');
  respond = () => {throw abort;};
  await assert.rejects(api.request('/api/me'), error => error === abort);
  respond = () => ({status: 200, ok: true, json: async () => {throw abort;}});
  await assert.rejects(api.request('/api/me'), error => error === abort);
  console.log('API client passed: JSON, base URL, credentials, structured errors, session expiry, malformed response, network and cancellation.');
})().catch(error => {console.error(error); process.exit(1);});
