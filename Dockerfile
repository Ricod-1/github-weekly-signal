# ============================================================
# 开源信号 · Docker 多阶段构建
# 阶段1：安装依赖
# 阶段2：运行生产环境
# ============================================================

# ---------- 阶段1：依赖安装 ----------
FROM node:20-alpine AS deps

WORKDIR /app

# 仅复制 package 文件，利用 Docker 缓存
COPY package.json package-lock.json* ./

# 安装生产依赖
RUN npm ci --omit=dev || npm install --omit=dev

# ---------- 阶段2：生产运行 ----------
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户运行应用，提升安全性
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制项目源码
COPY server ./server
COPY public ./public
COPY scripts ./scripts
COPY package.json ./
COPY .env.example ./.env.example

# 创建数据目录并设置权限
RUN mkdir -p /app/data/reports /app/public/generated && \
    chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 启动应用
CMD ["node", "server/index.js"]
