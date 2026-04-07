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

# Build the Frontend
WORKDIR /app/src/frontend
RUN npm install
RUN npm run build

# Back to root
WORKDIR /app

# Set host and port
ENV PORT=8080
ENV HOST=0.0.0.0

# Start the Relay Server
CMD exec uvicorn src.backend.main:app --host 0.0.0.0 --port $PORT
