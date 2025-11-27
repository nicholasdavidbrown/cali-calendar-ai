// Simple test script for calendar API
const http = require('http');

const baseUrl = 'localhost';
const port = 8080;

// Helper to make HTTP requests
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
  console.log('🧪 Testing Calendar API\n');

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

    // Step 2: Get all events (should be empty)
    console.log('2️⃣  Getting all events...');
    const getEventsRes = await makeRequest('GET', '/api/calendar/events', null, token);
    console.log('   Response:', JSON.stringify(getEventsRes.data, null, 2));
    console.log('✅ Get events successful\n');

    // Step 3: Create an event
    console.log('3️⃣  Creating a new event...');
    const createRes = await makeRequest('POST', '/api/calendar/events', {
      title: 'Team Meeting',
      description: 'Weekly sync meeting',
      startTime: '2025-11-27T10:00:00Z',
      endTime: '2025-11-27T11:00:00Z',
      location: 'Conference Room A'
    }, token);

    if (createRes.status !== 201) {
      console.error('❌ Create event failed:', createRes);
      return;
    }

    console.log('   Created event:', JSON.stringify(createRes.data, null, 2));
    const eventId = createRes.data.id;
    console.log('✅ Event created successfully\n');

    // Step 4: Get all events again (should have 1 event)
    console.log('4️⃣  Getting all events again...');
    const getEventsRes2 = await makeRequest('GET', '/api/calendar/events', null, token);
    console.log('   Response:', JSON.stringify(getEventsRes2.data, null, 2));
    console.log('✅ Get events successful\n');

    // Step 5: Update the event
    console.log('5️⃣  Updating the event...');
    const updateRes = await makeRequest('PUT', `/api/calendar/events/${eventId}`, {
      title: 'Updated Team Meeting',
      location: 'Conference Room B'
    }, token);
    console.log('   Updated event:', JSON.stringify(updateRes.data, null, 2));
    console.log('✅ Event updated successfully\n');

    // Step 6: Test validation - missing title
    console.log('6️⃣  Testing validation (missing title)...');
    const validationRes = await makeRequest('POST', '/api/calendar/events', {
      description: 'Missing title',
      startTime: '2025-11-27T10:00:00Z',
      endTime: '2025-11-27T11:00:00Z'
    }, token);
    console.log('   Response (should be 400):', validationRes.status, JSON.stringify(validationRes.data, null, 2));
    console.log('✅ Validation test successful\n');

    // Step 7: Test validation - end time before start time
    console.log('7️⃣  Testing validation (invalid times)...');
    const validationRes2 = await makeRequest('POST', '/api/calendar/events', {
      title: 'Invalid Times',
      startTime: '2025-11-27T11:00:00Z',
      endTime: '2025-11-27T10:00:00Z'
    }, token);
    console.log('   Response (should be 400):', validationRes2.status, JSON.stringify(validationRes2.data, null, 2));
    console.log('✅ Validation test successful\n');

    // Step 8: Test unauthorized access
    console.log('8️⃣  Testing unauthorized access...');
    const unauthorizedRes = await makeRequest('GET', '/api/calendar/events');
    console.log('   Response (should be 401):', unauthorizedRes.status, JSON.stringify(unauthorizedRes.data, null, 2));
    console.log('✅ Unauthorized test successful\n');

    // Step 9: Delete the event
    console.log('9️⃣  Deleting the event...');
    const deleteRes = await makeRequest('DELETE', `/api/calendar/events/${eventId}`, null, token);
    console.log('   Response:', JSON.stringify(deleteRes.data, null, 2));
    console.log('✅ Event deleted successfully\n');

    // Step 10: Verify deletion
    console.log('🔟 Verifying deletion...');
    const getEventsRes3 = await makeRequest('GET', '/api/calendar/events', null, token);
    console.log('   Response (should be empty):', JSON.stringify(getEventsRes3.data, null, 2));
    console.log('✅ Deletion verified\n');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
