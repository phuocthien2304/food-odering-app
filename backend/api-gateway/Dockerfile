# --- Giai đoạn 1: Builder (Để biên dịch code) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy file cấu hình
COPY package.json babel.config.js ./

# 1. Cài đặt TOÀN BỘ thư viện (bao gồm cả devDependencies để chạy được Babel)
RUN npm install

# Copy source code
COPY src ./src

# 2. Chạy lệnh build (Tạo ra thư mục dist)
RUN npm run build

# --- Giai đoạn 2: Production (Để chạy app) ---
FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json ./

# 3. Chỉ cài các thư viện cần thiết để chạy (Bỏ qua babel cho nhẹ)
RUN npm install --omit=dev

# 4. Copy thư mục 'dist' đã build từ giai đoạn 1 sang
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# 5. Chạy trực tiếp file đã biên dịch (Nhanh hơn npm start)
CMD ["node", "dist/main.js"]