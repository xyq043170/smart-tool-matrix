# Smart Tool Matrix

智能工具矩阵主站，负责统一的工具目录、用户账户、登录、额度、订阅和支付。
具体工具以独立项目维护，主站在检查访问额度后跳转到对应工具站。

## 项目职责

- 工具市场与搜索
- 邮箱和 Google 登录
- 用户账户与 JWT 鉴权
- 每日免费额度
- PayPal 支付与订阅
- 中英文和深浅主题
- 外部工具统一入口
- AI 肖像功能

命理工具已拆分到
[`xyq043170/ai-divination-tools`](https://github.com/xyq043170/ai-divination-tools)。

## 本地运行

后端需要 Python 3.11+ 和 PostgreSQL：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/python main.py
```

前端需要 Node.js 20+ 和 pnpm：

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

主站前端通常运行在 <http://localhost:5173>。

本地联调独立命理项目时，在 `frontend/.env` 中配置：

```env
VITE_API_BASE=
VITE_DIVINATION_TOOLS_URL=http://localhost:5174/
```

生产环境将 `VITE_DIVINATION_TOOLS_URL` 设置为独立命理站的正式地址。

## 构建

```bash
cd frontend
pnpm build
```

也可以使用 Docker Compose：

```bash
docker compose up --build
```

后端健康检查：<http://localhost:8000/health>

## 项目结构

```text
src/             FastAPI 后端、用户、认证、额度和订阅
frontend/        React + Vite 主站
src-tauri/       Tauri 桌面端配置
docs/            设计与实施文档
```
