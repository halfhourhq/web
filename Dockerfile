# Step 1: Use the official Node.js image as the base image
FROM node:22 as builder

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json files
COPY package*.json ./

# Step 4: Install all dependencies
RUN npm ci --omit=dev

# Step 5: Copy the rest of the app's source code
COPY . .

# Step 6: Build the SvelteKit app
RUN npm run build

# Step 7: Prepare the final image by using a smaller base image for the runtime
FROM node:22-slim

# Step 8: Set the working directory in the new image
WORKDIR /app

# Step 9: Copy only necessary files from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Step 10: Install production dependencies
RUN npm ci --omit=dev

# Step 11: Install dotenv for loading environment variables in production
RUN npm install dotenv

# Step 12: Set the command to run the app
CMD ["node", "-r", "dotenv/config", "build"]

# Expose the port the app runs on
EXPOSE 5173