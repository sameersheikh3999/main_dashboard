# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose the port used by react-scripts (3000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

