# Azure Web App Deployment Guide

## 🚨 Critical Issues to Watch For

### 1. **Container Startup Time (230s limit)**

Azure Web Apps will mark your container as unhealthy if it doesn't respond within **230 seconds**.

**✅ Your Setup:**
- Current startup time: ~2-5 seconds
- Health check endpoint: `/health`

**Azure Configuration:**
```bash
# In Azure Portal > Configuration > General settings
WEBSITES_CONTAINER_START_TIME_LIMIT=230
```

**Health Check Path:** Set to `/health` in Azure Portal > Health check settings

---

### 2. **Environment Variables** ⚠️ CRITICAL

**All environment variables must be configured in Azure:**

#### Server Container
```bash
# Required
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://<cosmos-db-connection-string>
JWT_SECRET=<generate-random-secure-string>

# Microsoft OAuth
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_TENANT_ID=consumers
REDIRECT_URI=https://your-server.azurewebsites.net/auth/callback

# Azure Storage (CRITICAL for user persistence)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Twilio
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-number>

# Anthropic
ANTHROPIC_API_KEY=<your-key>

# CORS
CLIENT_URL=https://your-client.azurewebsites.net
```

#### Client Container
```bash
NODE_ENV=production
VITE_APP_ENV=production
VITE_API_URL=https://your-server.azurewebsites.net
```

---

### 3. **MongoDB Connection Issues**

**⚠️ Your docker-compose.yml uses a local MongoDB container - this won't work in Azure Web Apps!**

**Solutions:**

#### Option A: Azure Cosmos DB (Recommended)
```bash
# Use Cosmos DB with MongoDB API
MONGODB_URI=mongodb://your-cosmos-account:password@your-cosmos-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000
```

#### Option B: Azure Container Instances
- Deploy MongoDB as a separate container in ACI
- Use Azure Files for persistence (already configured!)
- Update MONGODB_URI to point to ACI container

#### Option C: MongoDB Atlas
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calendar-sms?retryWrites=true&w=majority
```

---

### 4. **Port Configuration**

**⚠️ Azure Web Apps expose containers on port 80/443 externally**

Your server listens on **3001** internally ✅ (Azure will map this automatically)
Your client listens on **80** internally ✅ (correct for nginx)

**Azure App Settings:**
```bash
WEBSITES_PORT=3001  # For server container
WEBSITES_PORT=80    # For client container
```

---

### 5. **Logging Configuration**

**✅ Your extensive logging is already configured!**

**View logs in Azure:**
```bash
# Enable Application Logging
az webapp log config --name <app-name> --resource-group <group> \
  --application-logging filesystem --level information

# Stream logs
az webapp log tail --name <app-name> --resource-group <group>

# Download logs
az webapp log download --name <app-name> --resource-group <group>
```

---

### 6. **CORS Configuration** ⚠️ CRITICAL

Your server has CORS configured, but you need to update `CLIENT_URL`:

**In Azure App Settings:**
```bash
CLIENT_URL=https://your-client-app.azurewebsites.net
```

**Also check your client's API calls point to the correct server URL!**

---

### 7. **Container Registry Authentication**

**If using Azure Container Registry (ACR):**

```bash
# Enable ACR authentication
az webapp config container set \
  --name <app-name> \
  --resource-group <group> \
  --docker-custom-image-name <registry>.azurecr.io/<image>:<tag> \
  --docker-registry-server-url https://<registry>.azurecr.io \
  --docker-registry-server-user <username> \
  --docker-registry-server-password <password>
```

---

### 8. **SSL/HTTPS Certificates**

Azure Web Apps provide free SSL certificates, but:

1. **Update REDIRECT_URI** in Microsoft OAuth to use `https://`
2. **Update COOKIE settings** in your auth:

```typescript
// packages/server/src/routes/auth.ts
res.cookie('auth_token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // ✅ Already configured
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

### 9. **Microsoft OAuth Redirect URI**

**⚠️ MUST UPDATE in Azure Portal:**

1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Find your app registration
3. Add redirect URI: `https://your-server.azurewebsites.net/auth/callback`
4. Update environment variable to match

---

### 10. **Azure Storage Persistence** ✅

Your app already saves users to Azure Blob Storage! Just ensure:

```bash
# Connection string is configured
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

The container `user-backups` and blob `users.json` will be created automatically.

---

### 11. **Resource Limits**

Monitor your containers in Azure Portal:

- **CPU Usage**: Should be < 70%
- **Memory Usage**: Should be < 80%
- **Response Time**: Should be < 2s

**Upgrade App Service Plan if needed:**
```bash
az appservice plan update \
  --name <plan-name> \
  --resource-group <group> \
  --sku P1V2  # Production tier
```

---

### 12. **Container Image Size**

**Current images:**
- Server: ~400MB (node:18 base)
- Client: ~30MB (nginx:alpine base) ✅

**Optimize server image:**
```dockerfile
# Use node:18-alpine instead of node:18
FROM node:18-alpine

# Multi-stage build to reduce size
FROM node:18-alpine AS build
# ... build steps ...

FROM node:18-alpine
COPY --from=build /svr/app/server/dist /app/dist
COPY --from=build /svr/app/server/node_modules /app/node_modules
# ... rest of config
```

---

### 13. **Continuous Deployment**

**GitHub Actions example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Login to ACR
        uses: docker/login-action@v1
        with:
          registry: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push
        run: |
          docker build -f packages/server/Dockerfile -t ${{ secrets.ACR_LOGIN_SERVER }}/calendar-server:${{ github.sha }} .
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/calendar-server:${{ github.sha }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: your-server-app
          images: ${{ secrets.ACR_LOGIN_SERVER }}/calendar-server:${{ github.sha }}
```

---

### 14. **Database Initialization**

Your server loads users from Azure Blob on startup. This means:

✅ Data persists across container restarts
✅ No need for database migrations
⚠️ First deployment needs manual user creation OR upload users.json to blob storage

---

### 15. **Monitoring & Alerts**

**Set up Application Insights:**

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app <app-name> \
  --location eastus \
  --resource-group <group>

# Link to Web App
az webapp config appsettings set \
  --name <app-name> \
  --resource-group <group> \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

**Key metrics to monitor:**
- Response time > 3s
- HTTP 5xx errors
- Container restarts
- Memory/CPU usage
- Failed authentication attempts

---

## 🚀 Deployment Checklist

- [ ] Set up Azure Cosmos DB or MongoDB Atlas
- [ ] Create Azure Storage Account (for user backups)
- [ ] Configure all environment variables in Azure
- [ ] Update Microsoft OAuth redirect URIs
- [ ] Set health check path to `/health`
- [ ] Configure CORS with production URLs
- [ ] Enable Application Insights
- [ ] Test authentication flow end-to-end
- [ ] Test SMS sending (Twilio)
- [ ] Verify user data persistence (Azure Storage)
- [ ] Set up SSL certificates
- [ ] Configure custom domains (if needed)
- [ ] Set up monitoring alerts
- [ ] Test container scaling

---

## 🔍 Debugging Production Issues

Your extensive logging will help! Common issues:

### Container won't start
```bash
# Check logs
az webapp log tail --name <app-name> --resource-group <group>

# Look for:
# - MongoDB connection errors
# - Environment variable issues
# - Azure Storage connection failures
```

### Authentication not working
- Check REDIRECT_URI matches Azure App Registration
- Verify CLIENT_URL is set correctly
- Check cookie settings (secure flag)

### Users not persisting
- Check AZURE_STORAGE_CONNECTION_STRING
- Look for blob storage errors in logs
- Verify container `user-backups` exists

### SMS not sending
- Verify Twilio credentials
- Check phone number format
- Look for Twilio API errors in logs

---

## 📊 Cost Optimization

**App Service Plan:**
- Development: B1 Basic ($13/month)
- Production: P1V2 Premium ($117/month)

**Azure Storage:**
- Blob storage: ~$0.02/GB/month
- Transactions: ~$0.05/10k operations

**Cosmos DB:**
- Serverless: Pay per request
- Provisioned: ~$24/month minimum

**Total estimated cost: $50-150/month**
