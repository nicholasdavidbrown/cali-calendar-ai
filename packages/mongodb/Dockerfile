FROM mongo:latest

# Set environment variables
ENV MONGO_INITDB_DATABASE=calendar-sms

# Expose MongoDB port
EXPOSE 27017

# Create data directory
RUN mkdir -p /data/db

# Set volume for data persistence
VOLUME ["/data/db"]

# Start MongoDB
CMD ["mongod", "--bind_ip_all"]
