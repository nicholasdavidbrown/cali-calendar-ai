# Backend Types

This directory contains all TypeScript type definitions and constants used throughout the application.

## Files

- **`shared.ts`** - Core type definitions for all database models and API responses
- **`constants.ts`** - Application-wide constants, enums, and validation patterns
- **`index.ts`** - Re-exports all types and constants, provides utility functions

## Usage

### Importing Types

```typescript
// Import specific types
import { User, CalendarEvent, FamilyMember } from "./types/index.js";

// Import constants
import { MESSAGE_PERSONALITIES, CALENDAR_SOURCES, DEFAULTS } from "./types/index.js";

// Import utility functions
import { sqliteToBoolean, booleanToSqlite, formatDateForSqlite } from "./types/index.js";
```

### Type Definitions

#### Core Models

- `User` - User account information
- `CalendarEvent` - Calendar event data
- `FamilyMember` - Family member information
- `SmsHistory` - SMS message tracking
- `JoinCode` - Family invitation codes
- `CalendarIntegration` - OAuth tokens for calendar APIs
- `AdminSetting` - System configuration
- `SystemSetup` - Setup tracking

#### Create/Update Types

Each model has corresponding `Create*Data` and `Update*Data` types:
- `CreateUserData`
- `CreateEventData`
- `UpdateEventData`
- etc.

#### Response Types

- `UserResponse` - User data without password
- `LoginResponse` - Login response with token
- `RegisterResponse` - Registration response with token
- `ApiResponse<T>` - Generic API response wrapper

### Constants

#### Enums

```typescript
MESSAGE_PERSONALITIES  // Array of personality types
CALENDAR_SOURCES      // Array of calendar sources
CALENDAR_PROVIDERS    // Array of calendar providers
SMS_STATUSES         // Array of SMS statuses
TIMEZONES           // Array of supported timezones
```

#### Default Values

```typescript
DEFAULTS.TIMEZONE          // "America/Los_Angeles"
DEFAULTS.SMS_TIME          // "07:00"
DEFAULTS.MESSAGE_STYLE     // "professional"
DEFAULTS.JWT_EXPIRES_IN    // "7d"
DEFAULTS.SALT_ROUNDS       // 10
```

#### Error & Success Messages

```typescript
ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS
ERROR_MESSAGES.USER.NOT_FOUND
SUCCESS_MESSAGES.AUTH.LOGGED_IN
SUCCESS_MESSAGES.EVENT.CREATED
```

#### Validation Patterns

```typescript
VALIDATION_PATTERNS.EMAIL       // Email regex
VALIDATION_PATTERNS.PHONE_E164  // E.164 phone format
VALIDATION_PATTERNS.TIME_24H    // 24-hour time format
```

### Utility Functions

#### SQLite Boolean Conversion

```typescript
sqliteToBoolean(1)  // true
booleanToSqlite(true)  // 1
```

#### Date Formatting

```typescript
formatDateForSqlite(new Date())  // ISO string for SQLite
parseSqliteDate("2024-01-01T00:00:00.000Z")  // Date object
```

#### Type Guards

```typescript
isMessagePersonality("professional")  // true
isCalendarSource("manual")  // true
isSmsStatus("sent")  // true
```

## Example Usage

```typescript
import {
  User,
  CreateUserData,
  DEFAULTS,
  ERROR_MESSAGES,
  sqliteToBoolean,
  booleanToSqlite,
} from "./types/index.js";

// Creating a user object
const userData: CreateUserData = {
  email: "user@example.com",
  password: "hashedPassword",
  firstName: "John",
  lastName: "Doe",
};

// Using defaults
const timezone = DEFAULTS.TIMEZONE;
const smsTime = DEFAULTS.SMS_TIME;

// Using error messages
throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);

// Converting SQLite booleans
const isActive = sqliteToBoolean(user.isActive);
const sqliteValue = booleanToSqlite(true);
```

## Notes

- All files use `.js` extensions in imports due to NodeNext module resolution
- SQLite stores booleans as integers (0 or 1)
- Dates are stored as ISO strings in SQLite
- Use utility functions for type conversions
