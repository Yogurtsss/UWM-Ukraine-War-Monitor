# Railway Cloud Dockerfile: Frontend + Relay Backend
FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# 1. Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY package.json package-lock.json ./
RUN npm install

# 2. Build Frontend
# (Assuming Next.js is in src/frontend)
COPY src/frontend/package.json src/frontend/package-lock.json ./src/frontend/
RUN cd src/frontend && npm install --legacy-peer-deps

COPY . .

# Build the Next.js app
RUN cd src/frontend && npm run build

# 3. Expose the port (Railway provides $PORT)
EXPOSE 8000

# 4. Start the Relay server
# Note: Next.js frontend is assumed to be started concurrently or as static files.
# We'll stick to 'concurrently' to ensure the user's current Next.js structure works.
CMD ["npm", "run", "railway:start"]
