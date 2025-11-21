require 'sinatra/base'
require 'json'

class GemServer < Sinatra::Base
  set :port, ENV.fetch('PORT', 4000)
  set :bind, '0.0.0.0'

  configure do
    enable :logging
  end

  # Health check endpoint
  get '/health' do
    content_type :json
    { status: 'ok', timestamp: Time.now.iso8601 }.to_json
  end

  # Root endpoint
  get '/' do
    content_type :json
    {
      service: 'Ruby Gem Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/v1'
      }
    }.to_json
  end

  # Hello World endpoint
  get '/api/hello' do
    content_type :json
    { message: 'Hello, World!' }.to_json
  end

  # Example API endpoint
  get '/api/v1/gems' do
    content_type :json
    {
      gems: [
        { name: 'example-gem', version: '1.0.0', description: 'An example gem' }
      ]
    }.to_json
  end

  # Example POST endpoint
  post '/api/v1/gems' do
    request.body.rewind
    data = JSON.parse(request.body.read)

    content_type :json
    status 201
    {
      message: 'Gem created',
      data: data
    }.to_json
  rescue JSON::ParserError => e
    status 400
    { error: 'Invalid JSON', message: e.message }.to_json
  end

  # 404 handler
  not_found do
    content_type :json
    { error: 'Not found', path: request.path }.to_json
  end

  # Error handler
  error do
    content_type :json
    { error: 'Internal server error' }.to_json
  end

  # Start the server if this file is executed directly
  run! if app_file == $0
end
