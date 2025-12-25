# استخدم Node 18 Alpine كأساس
FROM node:18-alpine

# أنشئ مجلد التطبيق داخل الحاوية
WORKDIR /usr/src/parse

# انسخ ملفات package.json و package-lock.json
COPY package*.json ./

# تثبيت الحزم الإنتاجية مع تجاهل مشاكل peer dependencies
RUN npm install --production --legacy-peer-deps

# انسخ باقي ملفات التطبيق
COPY . .

# ضع المنفذ الذي سيعمل عليه التطبيق
EXPOSE 1337

# الأمر الافتراضي لتشغيل Parse Server
CMD ["npm", "start"]
