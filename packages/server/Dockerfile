FROM node:18

RUN mkdir -p /svr/app/server
WORKDIR /svr/app/server
COPY packages/server/ .

# install dependencies
RUN npm install --silent
RUN npm run build

WORKDIR /svr/app/server/dist/server/src/

# set node path so shared package in scope
ENV NODE_PATH=/svr/app/server/dist

# Expose port 3001
EXPOSE 3001

# run
ENTRYPOINT ["node", "index.js"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]
