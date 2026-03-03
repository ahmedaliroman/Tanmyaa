# Use the official Node.js 22 image.
# https://hub.docker.com/_/node
FROM node:22-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json and package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you prefer npm ci, use that instead.
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the app.
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Run the web service on container startup.
CMD [ "npm", "start" ]
