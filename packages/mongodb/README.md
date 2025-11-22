# MongoDB Container for Azure Deployment

This directory contains the MongoDB Dockerfile for deploying to Azure Web App for Containers.

## ⚠️ Important Considerations

### Data Persistence
- **Azure Web App containers are ephemeral by default**
- Data will be **lost on container restart** unless you configure Azure Files
- For production, consider using **Azure Cosmos DB** with MongoDB API instead

### When to Use This Approach
- ✅ Development/Demo environments
- ✅ Testing deployments
- ✅ Prototypes
- ❌ Production applications (use managed database service)

## 🔧 Azure Setup Steps

### 1. Create Azure Web App for MongoDB

```bash
# Create resource group (if not exists)
az group create --name cali-calendar-rg --location eastus

# Create App Service Plan (if not exists)
az appservice plan create \
  --name cali-calendar-plan \
  --resource-group cali-calendar-rg \
  --is-linux \
  --sku B1

# Create Web App for MongoDB
az webapp create \
  --resource-group cali-calendar-rg \
  --plan cali-calendar-plan \
  --name cali-calendar-mongodb \
  --deployment-container-image-name mongo:latest
```

### 2. Configure Port Settings

```bash
# Set MongoDB port
az webapp config appsettings set \
  --resource-group cali-calendar-rg \
  --name cali-calendar-mongodb \
  --settings WEBSITES_PORT=27017
```

### 3. Get Publish Profile

```bash
# Download publish profile
az webapp deployment list-publishing-profiles \
  --resource-group cali-calendar-rg \
  --name cali-calendar-mongodb \
  --xml
```

### 4. Add GitHub Secrets

In your GitHub repository, add these secrets:
- `CALI_MONGODB_PUBLISH_PROFILE` - The publish profile XML from step 3

### 5. Add Environment Variable

In your GitHub repository settings, add:
- `AZURE_MONGODB_RESOURCE_NAME` = `cali-calendar-mongodb`

Or update the workflow file to use the actual app name.

## 📝 Update Server Connection String

After MongoDB is deployed, update your server's environment variables:

```bash
# In Azure Portal → Server Web App → Configuration
MONGODB_URI=mongodb://<mongodb-app-name>.azurewebsites.net:27017/calendar-sms
```

Or if using private networking:
```bash
MONGODB_URI=mongodb://<mongodb-app-name>:27017/calendar-sms
```

## 🔒 Security Recommendations

### For Production:
1. **Use Azure Cosmos DB** with MongoDB API
2. Enable authentication
3. Use Azure Private Endpoints
4. Enable SSL/TLS
5. Configure firewall rules
6. Enable backup and disaster recovery

### For Demo/Testing:
1. Use IP restrictions in Azure Web App
2. Set up authentication environment variables
3. Monitor resource usage
4. Set auto-scale rules

## 💾 Optional: Configure Persistent Storage

To prevent data loss on restart:

```bash
# Create Storage Account
az storage account create \
  --name calicalendarstorage \
  --resource-group cali-calendar-rg \
  --location eastus \
  --sku Standard_LRS

# Create File Share
az storage share create \
  --name mongodb-data \
  --account-name calicalendarstorage

# Mount to Web App
az webapp config storage-account add \
  --resource-group cali-calendar-rg \
  --name cali-calendar-mongodb \
  --custom-id MongoDBData \
  --storage-type AzureFiles \
  --share-name mongodb-data \
  --account-name calicalendarstorage \
  --mount-path /data/db \
  --access-key <storage-account-key>
```

## 🚀 Deployment

Once configured, MongoDB will automatically deploy when you push to main:

```bash
git add .
git commit -m "Add MongoDB deployment"
git push origin main
```

## 📊 Monitoring

Monitor your MongoDB container:
- Azure Portal → Web App → Log Stream
- Check container logs for connection errors
- Monitor CPU and memory usage

## 🔄 Alternative: Use Cosmos DB (Recommended for Production)

Instead of this container approach, consider:

```bash
# Create Cosmos DB with MongoDB API
az cosmosdb create \
  --name cali-calendar-cosmos \
  --resource-group cali-calendar-rg \
  --kind MongoDB \
  --server-version 4.2

# Get connection string
az cosmosdb keys list \
  --name cali-calendar-cosmos \
  --resource-group cali-calendar-rg \
  --type connection-strings
```

Benefits:
- ✅ Fully managed
- ✅ Automatic backups
- ✅ Global distribution
- ✅ 99.99% SLA
- ✅ Built-in security
