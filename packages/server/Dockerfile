FROM node:18

RUN mkdir -p /svr/app/server
WORKDIR /svr/app/server
COPY packages/server/ .

# install dependencies
RUN npm install --silent
RUN npm run build

# Expose port 3001
EXPOSE 3001

# run
ENTRYPOINT ["node", "dist/src/index.js"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]
