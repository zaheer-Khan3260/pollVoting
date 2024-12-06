# Use Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/main

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the application's port
EXPOSE 3000

# Define the environment variables
ENV NODE_ENV=production

# Start the backend server
CMD ["npm", "dev"]
