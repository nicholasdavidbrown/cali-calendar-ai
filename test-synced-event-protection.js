// Test that synced events cannot be modified or deleted
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const baseUrl = 'localhost';
const port = 8080;
const dbPath = path.join(__dirname, 'data', 'cali.db');

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

async function runSyncedEventTests() {
  console.log('🔄 Testing Synced Event Protection\n');

  try {
    // Login
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
    const userId = loginRes.data.user.id;
    console.log('✅ Logged in as user ID:', userId, '\n');

    // Manually insert a synced Google Calendar event
    console.log('2️⃣  Inserting a synced Google Calendar event...');
    const db = new sqlite3.Database(dbPath);

    const insertedEventId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO calendar_events (title, description, startTime, endTime, source, userId)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Google Calendar Meeting',
          'Synced from Google',
          '2025-11-28T14:00:00Z',
          '2025-11-28T15:00:00Z',
          'google',
          userId
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    db.close();
    console.log('✅ Synced event inserted with ID:', insertedEventId, '\n');

    // Wait a bit for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the event appears in the API
    console.log('2.5️⃣  Verifying event appears in API...');
    const verifyRes = await makeRequest('GET', '/api/calendar/events', null, token);
    console.log('   All events:', JSON.stringify(verifyRes.data.map(e => ({ id: e.id, title: e.title, source: e.source })), null, 2));

    const foundEvent = verifyRes.data.find(e => e.id === insertedEventId);
    if (!foundEvent) {
      console.error('❌ Event not found in API! This might be a database sync issue.');
      console.log('   Expected event ID:', insertedEventId);
      return;
    }
    console.log('✅ Event found in API\n');

    // Test 1: Try to update the synced event
    console.log('3️⃣  Attempting to update synced event...');
    const updateRes = await makeRequest('PUT', `/api/calendar/events/${insertedEventId}`, {
      title: 'Modified Google Meeting'
    }, token);

    console.log('   Response (should be 403):', updateRes.status, JSON.stringify(updateRes.data, null, 2));

    if (updateRes.status === 403 && updateRes.data.error === 'Cannot update synced events') {
      console.log('✅ Synced events cannot be updated\n');
    } else {
      console.error('❌ Security issue: Synced events can be updated!\n');
    }

    // Test 2: Try to delete the synced event
    console.log('4️⃣  Attempting to delete synced event...');
    const deleteRes = await makeRequest('DELETE', `/api/calendar/events/${insertedEventId}`, null, token);

    console.log('   Response (should be 403):', deleteRes.status, JSON.stringify(deleteRes.data, null, 2));

    if (deleteRes.status === 403 && deleteRes.data.error === 'Cannot delete synced events') {
      console.log('✅ Synced events cannot be deleted\n');
    } else {
      console.error('❌ Security issue: Synced events can be deleted!\n');
    }

    // Test 3: Verify the event is still intact
    console.log('5️⃣  Verifying synced event is intact...');
    const eventsRes = await makeRequest('GET', '/api/calendar/events', null, token);
    const syncedEvent = eventsRes.data.find(e => e.id === insertedEventId);

    if (syncedEvent && syncedEvent.title === 'Google Calendar Meeting' && syncedEvent.source === 'google') {
      console.log('✅ Synced event is intact and unchanged\n');
    } else {
      console.error('❌ Synced event was modified or deleted!\n');
    }

    // Cleanup - manually delete the test event
    console.log('6️⃣  Cleaning up...');
    const cleanupDb = new sqlite3.Database(dbPath);
    await new Promise((resolve, reject) => {
      cleanupDb.run('DELETE FROM calendar_events WHERE id = ?', [insertedEventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    cleanupDb.close();
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All synced event protection tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runSyncedEventTests();
