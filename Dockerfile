FROM node:18-alpine

WORKDIR /usr/src/parse

# نسخ ملفات package
COPY package*.json ./

# تحديث npm لتجنب مشاكل peer dependencies
RUN npm install -g npm@11.7.0

# تثبيت الحزم الإنتاجية وتجاهل مشاكل peer dependencies
RUN npm install --production --legacy-peer-deps

# نسخ باقي ملفات التطبيق
COPY . .

# فتح البورت
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# تشغيل التطبيق
CMD ["npm", "start"]
