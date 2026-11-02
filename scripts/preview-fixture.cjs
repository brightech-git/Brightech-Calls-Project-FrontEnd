// Local UI fixture only. Does not connect to or write the Calls backend.
const http = require('node:http');
let records = [
  {
    linkId: 1,
    clientId: 1,
    clientName: 'QA Client',
    projectTypeId: 1,
    projectTypeName: 'Retail POS',
    url: 'https://example.com',
    userName: 'QAUSER',
    password: 'fixture',
    authPassword: '',
    status: 'L',
    type: 'W',
    active: true,
  },
];
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, 'http://localhost:8112');
  const route = url.pathname.replace('/api/v1', '');
  let text = '';
  for await (const part of req) text += part;
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    res.writeHead(400);
    return res.end();
  }
  let data = [];
  if (route === '/user/login')
    data = {
      userId: 999,
      username: 'QA ADMIN',
      token: 'fixture-token',
      isClient: 'N',
      menuIds: [],
    };
  else if (route === '/company')
    data = [{ COMPID: 1, COSTID: 'QA', COMPNAME: 'QA Company' }];
  else if (route === '/client') data = [{ CLIENTID: 1, CLIENTNAME: 'QA Client' }];
  else if (route === '/projecttype')
    data = [{ projectTypeId: 1, projectTypeName: 'Retail POS' }];
  else if (route === '/callsbooking') data = { content: [], totalPages: 0, last: true };
  else if (route.startsWith('/project-links')) {
    if (req.method === 'POST') {
      data = {
        ...body,
        linkId: records.length + 1,
        clientName: 'QA Client',
        projectTypeName: 'Retail POS',
      };
      records.push(data);
    } else if (req.method === 'PUT') {
      data = {
        ...body,
        linkId: Number(route.split('/').at(-1)),
        clientName: 'QA Client',
        projectTypeName: 'Retail POS',
      };
      records = records.map((row) => (row.linkId === data.linkId ? data : row));
    } else if (req.method === 'DELETE') {
      const id = Number(route.split('/').at(-1));
      data = records.find((row) => row.linkId === id);
      records = records.filter((row) => row.linkId !== id);
    } else
      data = records.filter(
        (row) =>
          (!url.searchParams.has('active') ||
            String(row.active) === url.searchParams.get('active')) &&
          (!url.searchParams.has('deviceType') ||
            row.type === url.searchParams.get('deviceType')),
      );
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true, message: 'Fixture only', data }));
});
server.listen(8112, '127.0.0.1', () =>
  console.log('Local fixture API listening on 8112'),
);
