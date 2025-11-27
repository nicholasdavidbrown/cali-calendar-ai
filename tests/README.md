# Test Files

This directory contains test scripts and API test files for the Cali Calendar AI application.

## Test Scripts (.js)

These are Node.js scripts that can be run directly to test various features:

### Authentication & Setup
- **test-setup.js** - Tests the admin setup wizard flow
  ```bash
  node tests/test-setup.js
  ```

### Calendar Events
- **test-calendar.js** - Basic calendar event CRUD operations
  ```bash
  node tests/test-calendar.js
  ```

- **test-calendar-security.js** - Tests user isolation and authorization
  ```bash
  node tests/test-calendar-security.js
  ```

- **test-synced-event-protection.js** - Tests that synced events can't be edited/deleted
  ```bash
  node tests/test-synced-event-protection.js
  ```

### SMS & Messaging
- **test-sms.js** - Tests SMS sending functionality with Twilio
  ```bash
  node tests/test-sms.js
  ```

### AI Integration
- **test-claude.js** - Tests Claude AI integration and message personalities
  ```bash
  node tests/test-claude.js
  ```

## HTTP Test Files (.http)

These files can be used with REST Client extensions (VS Code, IntelliJ) or tools like Postman:

- **test-calendar-api.http** - HTTP requests for calendar API endpoints
- **test-sms-api.http** - HTTP requests for SMS API endpoints

### Using .http files

1. **VS Code**: Install "REST Client" extension by Huachao Mao
2. **IntelliJ/WebStorm**: Built-in HTTP Client support
3. Open the .http file and click "Send Request" above each request

### Environment Variables for .http files

Make sure to update the token and other variables at the top of each .http file after logging in:

```
@token = your-jwt-token-here
@baseUrl = http://localhost:8080
```

## Running Tests

### Prerequisites

- Backend server must be running (`yarn dev` in backend folder or `docker compose up`)
- Database must be seeded with test data (`yarn db:seed` in backend folder)
- For SMS tests: Twilio credentials must be configured
- For Claude tests: Anthropic API key must be configured

### Test Credentials

**Development Mode (after `yarn db:seed`):**
- Email: admin@example.com
- Password: admin123

**Test Users (if created):**
- test@example.com / Test1234
- test2@example.com / Test1234

## Test Coverage

### ✅ Implemented Tests

- [x] Admin setup wizard
- [x] User authentication (register, login)
- [x] Calendar event CRUD
- [x] User isolation (users can only see their events)
- [x] Synced event protection
- [x] SMS sending with Twilio
- [x] Claude AI message generation
- [x] All 6+ personality styles

### 🔜 Future Tests

- [ ] Family member management
- [ ] Join codes and QR generation
- [ ] Calendar integrations (Google, Microsoft, TimeTree)
- [ ] Automated scheduler
- [ ] Message style CRUD operations

## Notes

- All test scripts use `fetch` for HTTP requests
- Tests assume server is running on `http://localhost:8080`
- Test scripts will create/modify data in the database
- Use a test database or run `yarn db:seed` to reset after testing
