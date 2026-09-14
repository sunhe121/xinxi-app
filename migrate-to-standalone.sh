#!/usr/bin/env bash
set -e

# 心系 - 去平台化迁移脚本
# 用法：bash migrate-to-standalone.sh
# 作用：将项目从妙搭平台依赖改为完全独立部署

echo "=== 心系应用去平台化迁移 ==="
echo ""

cd "$(dirname "$0")"

# 1. 替换 package.json
echo "[1/12] 替换 package.json..."
rm -f package.json
mv package-standalone.json package.json
rm -f package-lock.json

# 2. 替换前端入口 HTML
echo "[2/12] 替换前端入口 HTML..."
rm -f client/index.html
mv client/index-standalone.html client/index.html

# 3. 替换前端入口 TSX
echo "[3/12] 替换前端入口 TSX..."
rm -f client/src/index.tsx
mv client/src/index-standalone.tsx client/src/index.tsx

# 4. 替换前端 index.css
echo "[4/12] 替换前端 index.css..."
rm -f client/src/index.css
mv client/src/index-standalone.css client/src/index.css

# 5. 替换 Vite 配置
echo "[5/12] 替换 Vite 配置..."
rm -f vite.config.ts
mv vite.config.standalone.ts vite.config.ts

# 6. 替换 tailwind 配置
echo "[6/12] 替换 Tailwind 配置..."
rm -f tailwind.config.ts
mv tailwind.config.standalone.ts tailwind.config.ts

# 7. 替换 tsconfig
echo "[7/12] 替换 TypeScript 配置..."
rm -f tsconfig.app.json
mv tsconfig.app.standalone.json tsconfig.app.json
rm -f tsconfig.node.json
mv tsconfig.node.standalone.json tsconfig.node.json

# 8. 替换 nest-cli 配置
echo "[8/12] 替换 Nest CLI 配置..."
rm -f nest-cli.json
mv nest-cli-standalone.json nest-cli.json

# 9. 替换后端入口和 schema 和 database module
echo "[9/12] 替换后端入口、数据库 schema 和模块..."
rm -f server/main.ts
mv server/bootstrap-standalone.ts server/main.ts

rm -f server/database/schema.ts
mv server/database/schema.plain.ts server/database/schema.ts

rm -f server/database/database.module.ts
mv server/database/database.module.plain.ts server/database/database.module.ts

rm -f server/database/migrate.ts
mv server/database/migrate.plain.ts server/database/migrate.ts

# 10. 替换 app.module 和 view.controller
echo "[10/12] 替换 AppModule 和 ViewController..."
rm -f server/app.module.ts
mv server/app.module.standalone.ts server/app.module.ts

rm -f server/modules/view/view.controller.ts
mv server/modules/view/view.controller.standalone.ts server/modules/view/view.controller.ts

# 11. 批量替换所有 service 的数据库注入和导入路径
 echo "[11/12] 替换数据库注入和导入路径..."
 SERVICE_FILES=$(find server/modules -name "*.service.ts" -type f)
 for f in $SERVICE_FILES; do
   if grep -q "DRIZZLE_DATABASE" "$f"; then
     sed -i \
       -e "s|import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';|import { DB, type DbInstance } from '@server/database/database.module';|g" \
       -e "s|@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase|@Inject(DB) private readonly db: DbInstance|g" \
       "$f"
   fi
 done

 # 批量替换所有 .plain 后缀的导入路径（schema.plain -> schema, database.module.plain -> database.module 等）
 echo "  替换 .plain 导入路径..."
 ALL_TS_FILES=$(find server -name "*.ts" -type f)
 for f in $ALL_TS_FILES; do
   sed -i \
     -e "s|from '@server/database/schema.plain'|from '@server/database/schema'|g" \
     -e "s|from './schema.plain'|from './schema'|g" \
     -e "s|from '../database/schema.plain'|from '../database/schema'|g" \
     -e "s|from '@server/database/database.module.plain'|from '@server/database/database.module'|g" \
     "$f"
 done

# 替换业务代码中所有的 logger 导入
echo "  替换 logger 导入为本地实现..."
for f in $(grep -rl "@lark-apaas/client-toolkit/logger" client/src/ 2>/dev/null || true); do
  if [[ "$f" == *"business-ui"* ]]; then
    continue
  fi
  sed -i "s|import { logger } from '@lark-apaas/client-toolkit/logger';|import { appLogger as logger } from '@client/src/utils/logger';|g" "$f"
done

# 替换前端 logger 为纯 console 实现
echo "  替换 logger 为纯 console 实现..."
rm -f client/src/utils/logger.ts
rm -f client/src/utils/logger.standalone.ts
cat > client/src/utils/logger.ts << 'LOGGER_EOF'
/* eslint-disable no-console */
const PREFIX = '[心系]';

const info = (...args: unknown[]): void => {
  console.info(PREFIX, ...args);
};

const warn = (...args: unknown[]): void => {
  console.warn(PREFIX, ...args);
};

const error = (...args: unknown[]): void => {
  console.error(PREFIX, ...args);
};

const debug = (...args: unknown[]): void => {
  console.debug(PREFIX, ...args);
};

export const appLogger = { info, warn, error, debug };

export default appLogger;
LOGGER_EOF

# 11.5 批量清理所有 standalone 文件名引用（配置文件和代码中残留的引用）
echo "  清理所有 standalone 文件名引用..."
ALL_CONF_FILES=$(find . -name "*.json" -o -name "*.ts" -o -name "*.js" -o -name "*.css" -o -name "*.html" | grep -v node_modules | grep -v dist | grep -v ".git")
for f in $ALL_CONF_FILES; do
  if [[ "$f" == *"migrate-to-standalone.sh" ]]; then
    continue
  fi
  sed -i \
    -e "s|nest-cli-standalone.json|nest-cli.json|g" \
    -e "s|vite.config.standalone.ts|vite.config.ts|g" \
    -e "s|vite.config.standalone.js|vite.config.js|g" \
    -e "s|tailwind.config.standalone.ts|tailwind.config.ts|g" \
    -e "s|tailwind.config.standalone.js|tailwind.config.js|g" \
    -e "s|tsconfig.app.standalone.json|tsconfig.app.json|g" \
    -e "s|tsconfig.node.standalone.json|tsconfig.node.json|g" \
    -e "s|postcss.config.standalone.js|postcss.config.js|g" \
    -e "s|postcss.config.standalone.ts|postcss.config.ts|g" \
    "$f" 2>/dev/null || true
done

# 移除 business-ui 目录（平台专属组件）
echo "  移除 business-ui 平台组件..."
rm -rf client/src/components/business-ui

# 11.6 清理不需要的 PostCSS / ESLint / Stylelint 配置
# Tailwind v4 已通过 @tailwindcss/vite 插件集成，不再需要 postcss.config.js
echo "  清理 PostCSS / ESLint / Stylelint 平台配置..."
rm -f postcss.config.js
rm -f eslint.config.js
rm -f .stylelintrc.js
rm -f .prettierrc

# 12. 清理残留文件
echo "[12/12] 清理残留文件..."
rm -f migrate-to-standalone.sh
find . -name "*.standalone.*" -not -path "./node_modules/*" -delete 2>/dev/null || true

# 删除平台相关脚本
rm -rf scripts/

echo ""
echo "=== 迁移完成 ==="
echo ""
echo "接下来的步骤："
echo "1. 设置环境变量 DATABASE_URL=postgresql://user:pass@host:5432/dbname"
echo "2. 设置 JWT_SECRET=your-secret-key-at-least-32-characters"
echo "3. 执行 npm install 重新安装依赖"
echo "4. 执行数据库建表（将 user_profile 列转为 varchar(100)，参见 DEPLOY.md）"
echo "5. 执行 npm run build:prod 构建"
echo "6. 执行 npm start 启动应用"
