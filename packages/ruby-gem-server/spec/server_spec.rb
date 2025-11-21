require_relative 'spec_helper'

RSpec.describe GemServer do
  describe 'GET /health' do
    it 'returns health status' do
      get '/health'

      expect(last_response).to be_ok
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json['status']).to eq('ok')
      expect(json).to have_key('timestamp')
    end
  end

  describe 'GET /' do
    it 'returns service information' do
      get '/'

      expect(last_response).to be_ok
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json['service']).to eq('Ruby Gem Server')
      expect(json['version']).to eq('1.0.0')
      expect(json).to have_key('endpoints')
    end
  end

  describe 'GET /api/hello' do
    it 'returns hello world message' do
      get '/api/hello'

      expect(last_response).to be_ok
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json['message']).to eq('Hello, World!')
    end
  end

  describe 'GET /api/v1/gems' do
    it 'returns list of gems' do
      get '/api/v1/gems'

      expect(last_response).to be_ok
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json).to have_key('gems')
      expect(json['gems']).to be_an(Array)
    end
  end

  describe 'POST /api/v1/gems' do
    it 'creates a new gem' do
      gem_data = {
        name: 'test-gem',
        version: '1.0.0',
        description: 'A test gem'
      }

      post '/api/v1/gems', gem_data.to_json, { 'CONTENT_TYPE' => 'application/json' }

      expect(last_response.status).to eq(201)
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json['message']).to eq('Gem created')
      expect(json['data']).to include('name' => 'test-gem')
    end

    it 'returns error for invalid JSON' do
      post '/api/v1/gems', 'invalid json', { 'CONTENT_TYPE' => 'application/json' }

      expect(last_response.status).to eq(400)
      json = JSON.parse(last_response.body)
      expect(json['error']).to eq('Invalid JSON')
    end
  end

  describe 'GET /nonexistent' do
    it 'returns 404 for unknown routes' do
      get '/nonexistent'

      expect(last_response.status).to eq(404)
      expect(last_response.content_type).to include('application/json')

      json = JSON.parse(last_response.body)
      expect(json['error']).to eq('Not found')
    end
  end
end
