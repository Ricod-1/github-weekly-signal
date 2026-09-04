# 开源信号 · GitHub 周榜中文导读

> 每周日 18:00（上海时间）自动抓取 GitHub Trending 周榜，AI 生成中文导读，让每周的开源变化变得可读。

## ✨ 功能特性

- **自动周报**：每周日定时抓取 GitHub Trending 周榜前十项目
- **AI 导读**：DeepSeek 读取 README 后输出结构化中文导读（一句话总结、解决的问题、核心能力、快速开始、适合谁、注意事项）
- **智能配图**：优先使用 README 真实截图，无图时自动调用文生图模型生成
- **历史归档**：所有周报自动归档，支持浏览历史周报
- **主题切换**：支持深色 / 浅色主题，跟随系统偏好
- **搜索筛选**：支持按项目名、语言、描述搜索筛选
- **本地收藏**：浏览器本地收藏感兴趣的项目
- **RSS 订阅**：提供 RSS 订阅源，及时获取每周更新
- **周报导出**：支持将周报导出为 Markdown 文件
- **语言筛选**：支持按编程语言筛选 Trending 榜单

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 服务端 | Node.js + Express | 静态托管、REST API、定时任务 |
| 前端 | 原生 HTML/CSS/ES Modules | 零构建、轻量单页应用 |
| 定时任务 | node-cron | 每周日 18:00 自动生成周报 |
| 数据采集 | Fetch + Cheerio | 抓取并解析 GitHub Trending |
| AI 解读 | DeepSeek API | 结构化中文导读生成 |
| 图像生成 | 火山方舟 Seedream / OpenAI | 项目配图自动生成 |
| 数据存储 | JSON 文件 | 轻量本地存储，适合单实例部署 |
| 测试 | Node Test Runner | 内置测试框架，零依赖 |

## 📦 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm >= 9.0.0

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY（可选，不填则展示降级内容）

# 3. 启动服务
npm run dev

# 4. 打开浏览器
# http://localhost:3000
```

### 常用命令

```bash
npm run dev          # 启动开发服务
npm run stop         # 停止服务（Windows）
npm run restart      # 重启服务
npm test             # 运行测试
npm run lint         # 代码检查
npm run format       # 代码格式化
```

## ⚙️ 配置说明

复制 `.env.example` 为 `.env` 并按需填写：

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | `3000` | 服务监听端口 |
| `DEEPSEEK_API_KEY` | 线上必填 | - | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | DeepSeek 模型名称 |
| `DEEPSEEK_BASE_URL` | 否 | 官方地址 | DeepSeek API 地址（兼容 OpenAI 协议） |
| `IMAGE_PROVIDER` | 否 | 自动识别 | 图像服务：`volcengine` 或 `openai` |
| `VOLCENGINE_API_KEY` | 缺图时需要 | - | 火山方舟 API Key |
| `VOLCENGINE_IMAGE_MODEL` | 火山时必填 | - | Seedream 模型 ID 或 Endpoint ID |
| `VOLCENGINE_BASE_URL` | 否 | 官方地址 | 火山方舟 API 地址 |
| `OPENAI_API_KEY` | 缺图时需要 | - | OpenAI API Key |
| `OPENAI_IMAGE_MODEL` | 否 | `gpt-image-1` | OpenAI 图像模型 |
| `ADMIN_TOKEN` | 建议 | - | 管理接口鉴权令牌 |

## 📡 API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/report/latest` | 获取最新周报 |
| GET | `/api/reports` | 获取所有周报列表 |
| GET | `/api/report/:weekKey` | 获取指定周报 |
| GET | `/api/rss` | RSS 订阅源 |
| GET | `/api/report/:weekKey/export` | 导出周报为 Markdown |

### 管理接口（需 ADMIN_TOKEN）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/run-report` | 手动触发生成周报 |
| POST | `/api/project/:owner/:name/explanation` | 重新生成项目导读 |
| POST | `/api/project/:owner/:name/media` | 重新生成项目配图 |

## 🐳 Docker 部署

```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run
```

或直接使用 docker 命令：

```bash
docker build -t github-weekly-signal .
docker run -d \
  --name github-weekly-signal \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/generated:/app/public/generated \
  github-weekly-signal
```

## 📁 项目结构

```
.
├── server/                 # 后端服务
│   ├── index.js           # 应用入口
│   ├── config.js          # 配置管理
│   ├── report.js          # 周报生成逻辑
│   ├── storage.js         # 数据存储
│   ├── project-media.js   # 项目配图处理
│   ├── middleware/        # Express 中间件
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── auth.js
│   ├── routes/            # 路由模块
│   │   ├── report.js
│   │   ├── admin.js
│   │   ├── project.js
│   │   └── feed.js
│   ├── services/          # 业务服务
│   │   ├── trending.js    # GitHub Trending 抓取
│   │   ├── deepseek.js    # DeepSeek AI 导读
│   │   ├── media.js       # 图像生成与处理
│   │   └── retry.js       # 重试机制
│   └── utils/             # 工具函数
│       ├── logger.js      # 日志工具
│       └── exporter.js    # 周报导出
├── public/                 # 前端静态文件
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── project-cache.js
│   ├── modules/           # 前端模块
│   │   ├── theme.js
│   │   ├── search.js
│   │   ├── favorites.js
│   │   └── history.js
│   └── generated/         # 生成的图片缓存
├── data/reports/           # 周报数据存储
├── tests/                  # 测试用例
├── scripts/                # 运维脚本
├── docs/                   # 项目文档
├── .env.example            # 环境变量示例
├── .eslintrc.json          # ESLint 配置
├── .prettierrc             # Prettier 配置
├── Dockerfile              # Docker 构建
└── package.json
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

测试覆盖：
- GitHub Trending HTML 解析
- DeepSeek 请求构造
- 重试机制
- README 图片提取
- 项目配图处理
- 前端缓存逻辑

## 📝 开发规范

- 代码遵循 ESLint + Prettier 规范
- 提交前运行 `npm run lint && npm test`
- 中文注释，遵循阿里系代码规范
- 新功能需补充对应测试用例

## 📄 许可证

MIT License
