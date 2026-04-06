# Railway Cloud Dockerfile: Frontend + Relay Backend
FROM python:3.11-slim

# Install system dependencies and Node.js for frontend build
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement files first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .


# 3. Expose the port (Railway provides $PORT)
EXPOSE 8000

# 4. Start the Relay server
# Note: Next.js frontend is assumed to be started concurrently or as static files.
# We'll stick to 'concurrently' to ensure the user's current Next.js structure works.
CMD ["npm", "run", "railway:start"]
