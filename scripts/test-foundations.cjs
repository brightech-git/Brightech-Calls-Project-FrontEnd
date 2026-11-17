/* Tests run TypeScript through the installed compiler without introducing another runner. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const axios = require('axios');
const root = path.resolve(__dirname, '..');
const modules = new Map();
const storage = new Map();
let changes = 0;
const browser = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  dispatchEvent: () => changes++,
};
function load(name) {
  const filename = path.resolve(root, name);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const requireLocal = (spec) => {
    if (!spec.startsWith('@/') && !spec.startsWith('.')) return require(spec);
    let target = spec.startsWith('@/')
      ? path.join(root, spec.slice(2))
      : path.resolve(path.dirname(filename), spec);
    if (!path.extname(target)) target += '.ts';
    return load(path.relative(root, target));
  };
  vm.runInNewContext(
    code,
    {
      exports: module.exports,
      module,
      require: requireLocal,
      process,
      console,
      Date,
      Intl,
      Error,
      RangeError,
      FormData,
      Event,
      window: browser,
      localStorage: browser.localStorage,
      AbortController,
      URL,
      setTimeout,
      clearTimeout,
    },
    { filename },
  );
  return module.exports;
}
async function main() {
  const date = load('utils/format/date.ts');
  assert.equal(date.formatDate('2026-11-02'), '02-11-2026');
  assert.equal(date.formatDate('2026-11-02', true), '02-11-26');
  assert.equal(date.formatApiDate(new Date(2026, 10, 2)), '2026-11-02');
  assert.equal(date.formatDate('2026-02-30'), '');
  assert.equal(date.formatDate('invalid'), '');
  assert.equal(date.formatDateTime(new Date(2026, 10, 2, 9, 4, 3)), '02-11-26 09:04:03');
  assert.equal(date.formatTime('09:04'), '09:04:00');
  const numbers = load('utils/format/number.ts');
  assert.equal(numbers.formatNumber(12.5), '12.50');
  assert.equal(numbers.formatWeight(12.5), '12.500');
  assert.equal(numbers.formatWeight(12.5, 4), '12.5000');
  assert.equal(numbers.toNumber(''), null);
  assert.equal(numbers.toNumber('1,2,3'), null);
  assert.equal(numbers.formatNumber(Infinity), '');
  assert.equal(numbers.roundNumber(1.005), 1.01);
  assert.equal(numbers.roundNumber(-1.005), -1.01);
  assert.ok(Math.abs(numbers.calculateWeight(10.12345, 1.11111) - 9.01234) < 1e-10);
  assert.throws(() => numbers.calculateWeight(1, 2));
  const session = load('lib/auth/session.ts');
  const errors = load('lib/api/errors.ts');
  session.saveSession({
    userId: '999',
    calls_token: 'fixture-token',
    isLoggedIn: 'true',
  });
  const { axiosInstance: client } = load('api/axiosInstance.ts');
  const requests = [];
  client.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { success: true, message: 'ok', data: [] },
    };
  };
  await client.get('/project-links');
  assert.equal(requests.length, 1, 'No hidden company request');
  assert.equal(requests[0].headers.Authorization, 'Bearer fixture-token');
  assert.equal(requests[0].headers.USERID, '999');
  await client.post('/project-links', new FormData());
  assert.ok(
    !String(requests.at(-1).headers['Content-Type']).includes('application/json'),
  );
  client.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: { success: false, message: 'Validation failed' },
  });
  await assert.rejects(
    () => client.get('/project-links'),
    (error) => error instanceof errors.ApiError && error.message === 'Validation failed',
  );
  client.defaults.adapter = async (config) => {
    throw new axios.AxiosError(
      'Rejected',
      'ERR_BAD_REQUEST',
      config,
      {},
      {
        config,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        data: { message: 'Session expired' },
      },
    );
  };
  await assert.rejects(
    () => client.get('/project-links'),
    (error) =>
      error.statusCode === 401 && error.response.data.message === 'Session expired',
  );
  assert.equal(session.readSession().token, '');
  assert.ok(changes > 0);
  const query = load('lib/query/client.ts').createQueryClient();
  const retry = query.getDefaultOptions().queries.retry;
  assert.equal(retry(0, new errors.ApiError('Forbidden', 403)), false);
  assert.equal(retry(0, new errors.ApiError('Unavailable', 503)), true);
  assert.equal(retry(1, new Error('Network')), false);
  query.clear();
  const schema = load('features/project-links/schema.ts');
  assert.equal(
    schema.projectLinkSchema.safeParse(schema.projectLinkDefaults).success,
    false,
  );
  assert.equal(
    schema.projectLinkSchema.safeParse({
      ...schema.projectLinkDefaults,
      clientId: 1,
      projectTypeId: 1,
      url: 'javascript:alert(1)',
    }).success,
    false,
  );
  assert.equal(
    schema.projectLinkSchema.safeParse({
      ...schema.projectLinkDefaults,
      clientId: 1,
      projectTypeId: 1,
      url: 'https://example.com',
    }).success,
    true,
  );

  client.defaults.adapter = async (config) => {
    throw new axios.AxiosError(
      'Bad request',
      'ERR_BAD_REQUEST',
      config,
      {},
      {
        config,
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        data: {
          success: false,
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          data: { clientId: 'Client is required' },
        },
      },
    );
  };
  await assert.rejects(
    () => client.post('/project-links', {}),
    (error) =>
      error.code === 'VALIDATION_FAILED' &&
      error.errors.clientId === 'Client is required',
  );
  const bookingPages = [];
  client.defaults.adapter = async (config) => {
    bookingPages.push(config.params);
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        message: 'success',
        data: {
          content: [{ sno: config.params.page + 1 }],
          number: config.params.page,
          first: config.params.page === 0,
          last: config.params.page === 1,
          totalPages: 2,
          totalElements: 2,
        },
      },
    };
  };
  const bookings = load('services/TaskAssignmentService.ts');
  const table = await bookings.getCallsBookingsForTable({ asOn: false, clientId: '5' });
  assert.equal(table.content.length, 2, 'The table must include subsequent API pages');
  assert.equal(bookingPages.length, 2);
  assert.ok(
    bookingPages.every((params) => params.size === 200 && params.clientId === '5'),
  );
  await bookings.getAllCallsBookings({ asOn: false, size: 1000 });
  assert.equal(
    bookingPages.at(-1).size,
    200,
    'Requests must respect the backend page-size limit',
  );

  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    () => client.get('/project-links', { signal: cancelled.signal }),
    axios.isCancel,
  );
  console.log(
    'Passed: dates, precision, validation, session lifecycle, request headers, no company waterfall, multipart, API errors, 401, retry policy, cancellation, backend validation fields and booking page limits.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
