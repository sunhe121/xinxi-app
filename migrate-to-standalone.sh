#!/usr/bin/env bash
set -e

# 心系 - 去平台化迁移脚本
# 用法：bash migrate-to-standalone.sh
# 作用：将项目从妙搭平台依赖改为完全独立部署

echo "=== 心系应用去平台化迁移 ==="
echo ""

cd "$(dirname "$0")"

# 1. 替换 package.json
echo "[1/9] 替换 package.json..."
rm -f package.json
mv package-standalone.json package.json

# 2. 替换前端入口
echo "[2/9] 替换前端入口文件..."
rm -f client/index.html
mv client/index-standalone.html client/index.html
rm -f client/src/index.tsx
mv client/src/index-standalone.tsx client/src/index.tsx

# 3. 替换 Vite 配置
echo "[3/9] 替换 Vite 配置..."
rm -f vite.config.ts
mv vite.config.standalone.ts vite.config.ts

# 4. 替换 tsconfig
echo "[4/9] 替换 TypeScript 配置..."
rm -f tsconfig.app.json
mv tsconfig.app.standalone.json tsconfig.app.json
rm -f tsconfig.node.json
mv tsconfig.node.standalone.json tsconfig.node.json

# 5. 替换 nest-cli 配置
echo "[5/9] 替换 Nest CLI 配置..."
rm -f nest-cli.json
mv nest-cli-standalone.json nest-cli.json

# 6. 替换后端入口和 schema
echo "[6/9] 替换后端入口和数据库 schema..."
rm -f server/main.ts
mv server/bootstrap-standalone.ts server/main.ts
rm -f server/database/schema.ts
mv server/database/schema.plain.ts server/database/schema.ts

# 7. 修改 app.module.ts - 移除 PlatformModule，替换为 DatabaseModule
echo "[7/9] 修改后端模块和 service..."

sed -i \
  -e "s|import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';|import { DatabaseModule } from './database/database.module';|" \
  -e "s|PlatformModule.forRoot()|DatabaseModule|" \
  server/app.module.ts

# 替换所有 service 的 DRIZZLE_DATABASE -> DB，替换 drizzle 导入来源
SERVICE_FILES=$(find server/modules -name "*.service.ts" -type f)
for f in $SERVICE_FILES; do
  if grep -q "DRIZZLE_DATABASE" "$f"; then
    sed -i \
      -e "s|@Inject(DRIZZLE_DATABASE)|@Inject(DB)|g" \
      -e "s|DRIZZLE_DATABASE, ||g" \
      -e "s|import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';|import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';|" \
      "$f"
  fi
done

# 修改 view.controller.ts - 移除平台数据注入
cat > server/modules/view/view.controller.ts << 'EOF'
import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '@server/common/guards/jwt-auth.guard';

@Controller()
@Public()
export class ViewController {

  @Get(['/', '*'])
  @Render('index')
  async render(): Promise<Record<string, string>> {
    return {};
  }
}
EOF

# 8. 移除 business-ui 目录和 logger 替换
echo "[8/9] 清理平台业务组件和工具..."
rm -rf client/src/components/business-ui

# 替换 logger 为纯 console 实现
cat > client/src/utils/logger.ts << 'EOF'
const PREFIX = '[心系]';

export const appLogger = {
  info(...args: unknown[]) {
    console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]) {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]) {
    console.error(PREFIX, ...args);
  },
  debug(...args: unknown[]) {
    console.debug(PREFIX, ...args);
  },
};

export default appLogger;
EOF

# 9. 删除迁移脚本自身和所有 standalone 残留
echo "[9/9] 清理残留文件..."
rm -f migrate-to-standalone.sh
# 删除其他可能的 standalone 文件
find . -name "*.standalone.*" -not -path "./node_modules/*" -delete 2>/dev/null || true

echo ""
echo "=== 迁移完成 ==="
echo ""
echo "接下来的步骤："
echo "1. 设置环境变量 DATABASE_URL=postgresql://user:pass@host:5432/dbname"
echo "2. 设置 JWT_SECRET=your-secret-key-at-least-32-characters"
echo "3. 执行 npm install 重新安装依赖"
echo "4. 执行数据库迁移（将 user_profile 列转为 varchar(100)，参见 DEPLOY.md）"
echo "5. 执行 npm run build:prod 构建"
echo "6. 执行 npm start 启动应用"
