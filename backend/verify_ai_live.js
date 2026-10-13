const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('--- 1. Authenticating as analyst@bi.corp ---');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'analyst@bi.corp', password: 'Analyst123!' }
  );

  if (loginRes.status !== 200 || !loginRes.data.success) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken;
  console.log('Login successful. Access token obtained.');

  const questions = [
    'What were total sales last month?',
    'Show the top 10 customers by sales.',
    'Which product generated the highest revenue?',
    'Compare this month with the previous month.',
    'Give me city-wise sales for the last three months.',
    'Summarize business performance for the current quarter.',
    'Which customers have reduced their purchases?',
  ];

  console.log('\n--- 2. Testing 7 Approved Natural Language BI Queries ---');
  for (const q of questions) {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/ai/ask',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      { question: q }
    );

    if (res.status === 200 && res.data.success) {
      const d = res.data.data;
      console.log(`[PASS] "${q}"`);
      console.log(`       Operation: ${d.operation}`);
      console.log(`       Title:     ${d.reportTitle}`);
      console.log(`       Answer:    ${d.answer.slice(0, 90)}...`);
      console.log(`       Rows:      ${d.rows ? d.rows.length : 0} rows | Metrics:`, d.summaryMetrics);
    } else {
      console.error(`[FAIL] "${q}"`, res);
      process.exit(1);
    }
  }

  console.log('\n--- 3. Testing Unsupported Question ---');
  const unsuppRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { question: 'What is the weather in Antarctica today?' }
  );

  console.log(`Status: ${unsuppRes.status}, intent: ${unsuppRes.data?.data?.intent}`);
  if (unsuppRes.status === 200 && unsuppRes.data?.data?.intent === 'UNSUPPORTED') {
    console.log('[PASS] Unsupported query handled politely with guidance and suggestions.');
  } else {
    console.error('[FAIL] Expected 200 with intent UNSUPPORTED, got:', unsuppRes);
    process.exit(1);
  }

  console.log('\n--- 4. Testing SQL Injection Attempt in Natural Language ---');
  const sqliRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { question: 'Show sales; DROP TABLE sales; --' }
  );

  console.log(`Status: ${sqliRes.status}, intent: ${sqliRes.data?.data?.intent}`);
  if (sqliRes.data?.data?.intent === 'SECURITY_BLOCKED') {
    console.log('[PASS] SQL injection pattern safely identified and blocked.');
  } else {
    console.error('[FAIL] SQL injection was not blocked:', sqliRes);
    process.exit(1);
  }

  console.log('\n--- 5. Testing Unauthorized Request ---');
  const unauthRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/ask',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { question: 'What were total sales last month?' }
  );

  if (unauthRes.status === 401) {
    console.log('[PASS] Unauthorized request rejected with 401.');
  } else {
    console.error('[FAIL] Expected 401, got:', unauthRes);
    process.exit(1);
  }

  console.log('\nAll Live HTTP AI verification checks PASSED!');
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
