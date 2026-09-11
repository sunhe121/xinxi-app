# 心系 - 独立部署指南

"心系"是一款 AI 亲情关怀应用，帮助异地子女和老人通过 AI 自动总结每日生活状态，生成温暖的语音播报。

本文档介绍如何从零开始独立部署本应用。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: NestJS 10 + TypeScript
- **数据库**: PostgreSQL 14+
- **认证**: JWT（昵称 + 密码）
- **AI**: 支持任意 OpenAI 兼容格式的大模型 API

---

## 一、本地开发启动

### 前置要求

- Node.js >= 22.0.0
- PostgreSQL >= 14
- npm 或 pnpm

### 步骤

#### 1. 克隆代码

```bash
git clone <仓库地址>
cd xinxi
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入数据库连接信息：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/xinxi
JWT_SECRET=your-secret-key-at-least-32-characters
OPENAI_API_KEY=           # 可选，配置后启用真实AI生成
OPENAI_BASE_URL=          # 可选，默认 https://api.openai.com/v1
PORT=3001
```

#### 4. 创建数据库

```sql
CREATE DATABASE xinxi;
```

#### 5. 初始化数据库表结构

应用启动时会通过 Drizzle ORM 自动创建所需表结构（如果不存在的话）。
也可以手动执行 `server/database/schema.sql` 中的建表语句。

#### 6. 启动开发服务

```bash
# 启动后端（端口 3001）
npm run dev:server

# 启动前端（端口 5173，代理 /api 到后端）
npm run dev:client
```

打开浏览器访问 `http://localhost:5173`

---

## 二、生产部署

### 方案一：Vercel（前端） + Railway（后端） + Supabase（数据库）

这是最简单的部署方案，适合个人和小团队使用。

#### 数据库：Supabase

1. 注册 [Supabase](https://supabase.com/) 账号
2. 创建一个新项目，选择离用户最近的区域
3. 在 Settings → Database 中复制 Connection String
4. 格式类似：`postgresql://postgres:password@db.supabase.co:5432/postgres`
5. 在 SQL Editor 中执行建表 SQL（参考 `server/database/schema.ts`）

#### 后端：Railway / Render / Fly.io

以 Railway 为例：

1. 注册 [Railway](https://railway.app/) 账号
2. 点击 "New Project" → "Deploy from GitHub"
3. 选择仓库
4. 配置：
   - Build Command: `npm install && npm run build:server`
   - Start Command: `npm run start:server`
   - Root Directory: `/`
5. 添加环境变量（Settings → Variables）：
   - `DATABASE_URL`: Supabase 的连接字符串
   - `JWT_SECRET`: 随机长字符串
   - `OPENAI_API_KEY`: 你的 AI API Key（可选）
   - `OPENAI_BASE_URL`: AI API 地址（可选）
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
6. 部署成功后，记录后端服务的公网地址

#### 前端：Vercel

1. 注册 [Vercel](https://vercel.com/) 账号
2. Import Project，选择仓库
3. 配置：
   - Framework Preset: Vite
   - Build Command: `npm run build:client`
   - Output Directory: `client/dist`
4. 添加环境变量：
   - `VITE_API_BASE_URL`: 你的后端服务地址（如 `https://xinxi-api.vercel.app`）
5. 部署成功后，通过 Vercel 提供的域名访问

### 方案二：单服务器部署（Docker / 宝塔）

适合有自己服务器的情况。

#### 1. 构建前端

```bash
npm run build:client
```

构建产物在 `client/dist/` 目录。

#### 2. 构建后端

```bash
npm run build:server
```

#### 3. 部署

- 将 `client/dist/` 用 Nginx 托管
- 后端用 PM2 或 systemd 运行
- Nginx 配置 `/api` 反向代理到后端服务

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name xinxi.example.com;

    root /var/www/xinxi/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 方案三：Docker 部署

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:client && npm run build:server

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3001
CMD ["node", "dist/server/main.js"]
```

---

## 三、环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | 是 | - | PostgreSQL 数据库连接地址 |
| `JWT_SECRET` | 是 | - | JWT 签名密钥，建议至少 32 位随机字符串 |
| `OPENAI_API_KEY` | 否 | - | AI 接口 API Key，不配置则使用预设模板生成播报 |
| `OPENAI_BASE_URL` | 否 | `https://api.openai.com/v1` | AI 接口地址，支持 OpenAI 兼容格式 |
| `OPENAI_MODEL` | 否 | `gpt-4o-mini` | 使用的模型名称 |
| `PORT` | 否 | `3001` | 后端服务监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境，生产环境设为 `production` |

---

## 四、常见问题排查

### 1. 启动后数据库连接失败

- 检查 `DATABASE_URL` 是否正确
- 确认数据库服务是否正常运行
- 检查防火墙是否允许数据库端口访问

### 2. AI 播报生成失败

- 检查 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 是否配置正确
- 确认 API Key 是否还有额度
- 未配置 API Key 时会使用预设模板生成，属正常情况

### 3. 登录后立即被跳回登录页

- 检查 JWT_SECRET 是否正确配置
- 确认后端服务时间是否准确（JWT 有时效性）
- 检查浏览器是否禁用了 localStorage

### 4. 录音功能无法使用

- 录音需要 HTTPS 环境（localhost 除外）
- 浏览器需要麦克风权限
- 第一版录音保存在浏览器内存中，刷新页面会丢失

### 5. 语音播放在 iOS Safari 上没声音

- iOS 需要用户手动触发才能播放音频（点击播放按钮）
- 确认系统静音开关已关闭
- 语音合成使用浏览器内置 Web Speech API

### 6. 上传到桌面 / PWA 不生效

- 需要 HTTPS 环境
- 已配置 manifest.json 和 Service Worker
- iOS Safari: 分享 → 添加到主屏幕
- Android Chrome: 菜单 → 添加到主屏幕

---

## 五、更新版本

```bash
git pull
npm install
npm run build:client
npm run build:server
# 重启后端服务
```

---

## 六、备份与恢复

### 数据库备份

```bash
pg_dump -h localhost -U postgres xinxi > backup.sql
```

### 数据库恢复

```bash
psql -h localhost -U postgres xinxi < backup.sql
```

---

## 七、更多帮助

如有问题，请参考项目 README 或提交 Issue。
