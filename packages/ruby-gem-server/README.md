# Ruby Gem Server

A simple Ruby gem server built with Sinatra.

## Requirements

- Ruby >= 3.0.0
- Bundler

## Setup

Install dependencies:

```bash
bundle install
```

## Running the Server

### Development (with auto-reload)

```bash
bundle exec rerun -- rackup config.ru -p 4000
```

### Production

```bash
bundle exec rackup config.ru -p 4000
```

### Using Puma directly

```bash
bundle exec puma config.ru -p 4000
```

## Environment Variables

- `PORT` - Server port (default: 4000)

## API Endpoints

### Health Check

```bash
GET /health
```

### List Gems

```bash
GET /api/v1/gems
```

### Create Gem

```bash
POST /api/v1/gems
Content-Type: application/json

{
  "name": "my-gem",
  "version": "1.0.0",
  "description": "My awesome gem"
}
```

## Testing

Run tests:

```bash
bundle exec rspec
```

## Project Structure

```
.
├── Gemfile           # Gem dependencies
├── config.ru         # Rack configuration
├── server.rb         # Main server application
└── spec/             # Test files
```
