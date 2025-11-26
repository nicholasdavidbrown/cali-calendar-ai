// Test script for SMS API endpoints
const http = require('http');

const baseUrl = 'localhost';
const port = 8080;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseUrl,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing SMS API\n');

  try {
    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test2@example.com',
      password: 'Test1234'
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes);
      return;
    }

    const token = loginRes.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get SMS history (should be empty initially)
    console.log('2️⃣  Getting SMS history...');
    const historyRes = await makeRequest('GET', '/api/sms/history', null, token);

    if (historyRes.status !== 200) {
      console.error('❌ Get SMS history failed:', historyRes);
      return;
    }

    console.log('   Response:', JSON.stringify(historyRes.data, null, 2));
    console.log('✅ SMS history endpoint working\n');

    // Step 3: Try to send test SMS (will fail without Twilio config, but endpoint should respond)
    console.log('3️⃣  Testing send test SMS endpoint (without Twilio config)...');
    const testSmsRes = await makeRequest('POST', '/api/sms/test', {
      phoneNumber: '+1234567890'
    }, token);

    console.log('   Response:', testSmsRes.status, JSON.stringify(testSmsRes.data, null, 2));

    if (testSmsRes.status === 500 && testSmsRes.data.details === 'Twilio not configured') {
      console.log('✅ Test SMS endpoint working (failed as expected without Twilio config)\n');
    } else if (testSmsRes.status === 200) {
      console.log('✅ Test SMS sent successfully (Twilio configured!)\n');
    } else {
      console.log('⚠️  Unexpected response from test SMS endpoint\n');
    }

    // Step 4: Try to send daily summary (will fail without Twilio config)
    console.log('4️⃣  Testing send daily summary endpoint (without Twilio config)...');
    const summaryRes = await makeRequest('POST', '/api/sms/send-daily-summary', null, token);

    console.log('   Response:', summaryRes.status, JSON.stringify(summaryRes.data, null, 2));

    if (summaryRes.status === 500 || summaryRes.status === 400) {
      console.log('✅ Daily summary endpoint working (failed as expected without config)\n');
    } else if (summaryRes.status === 200) {
      console.log('✅ Daily summary sent successfully (Twilio configured!)\n');
    } else {
      console.log('⚠️  Unexpected response from daily summary endpoint\n');
    }

    // Step 5: Test validation - invalid phone number
    console.log('5️⃣  Testing validation (invalid phone number)...');
    const validationRes = await makeRequest('POST', '/api/sms/test', {
      phoneNumber: 'invalid'
    }, token);

    console.log('   Response (should be 400):', validationRes.status, JSON.stringify(validationRes.data, null, 2));

    if (validationRes.status === 400) {
      console.log('✅ Phone number validation working\n');
    } else {
      console.log('⚠️  Phone number validation not working as expected\n');
    }

    // Step 6: Test unauthorized access
    console.log('6️⃣  Testing unauthorized access...');
    const unauthorizedRes = await makeRequest('GET', '/api/sms/history');

    console.log('   Response (should be 401):', unauthorizedRes.status, JSON.stringify(unauthorizedRes.data, null, 2));

    if (unauthorizedRes.status === 401) {
      console.log('✅ Authorization working\n');
    } else {
      console.log('⚠️  Authorization not working as expected\n');
    }

    console.log('🎉 All SMS API tests completed!');
    console.log('\n📝 Note: To test actual SMS sending, configure Twilio credentials in the database:');
    console.log('   1. Go to http://localhost:8081 (SQLite Web)');
    console.log('   2. Insert Twilio credentials into admin_settings table');
    console.log('   3. Run this test again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
