# Use a combined Python and Node.js image
FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# 1. Install Backend dependencies
COPY src/backend/requirements.txt ./src/backend/
RUN pip install --no-cache-dir -r src/backend/requirements.txt

# 2. Install Root and Frontend dependencies
COPY package.json package-lock.json ./
COPY src/frontend/package.json src/frontend/package-lock.json ./src/frontend/
RUN npm install
RUN cd src/frontend && npm install --legacy-peer-deps

# 3. Copy source code
COPY . .

# 4. Build Frontend
RUN cd src/frontend && npm run build

# 5. Expose ports
EXPOSE 8000
EXPOSE 3000

# 6. Start both services
CMD ["npm", "run", "railway:start"]
