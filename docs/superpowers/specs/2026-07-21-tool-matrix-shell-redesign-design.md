# 工具矩阵壳层视觉统一设计

**日期：** 2026-07-21  
**状态：** 已确认，待实现计划  
**仓库：** `chatgpt-tarot-divination`（主站）  
**相关：** `tools-hub` 退役，不再作为用户入口

## 1. 背景与结论

当前 monorepo 工作区中存在两套前端入口：

| 角色 | 仓库 | 现状 |
|------|------|------|
| 主站 / 平台壳 | `chatgpt-tarot-divination` | 完整产品：auth（email/Google/GitHub）、JWT、配额、订阅（PayPal）、占卜业务、iframe 嵌入外部工具 |
| 工具目录站 | `tools-hub` | vinext 轻量目录；登录/订阅外链到主站；无独立产品级账号体系 |

曾讨论过「把 auth 剥离到 hub、tarot 做成纯工具内嵌页」。在**最小改造成本**约束下，结论是：

- **不做** 跨应用 SSO / hub 身份中心 / 把 tarot 前端迁入 vinext。
- **采用方案 B：以 tarot 前端为唯一主站壳**，壳层优先 + Design Token 视觉统一。
- **停用 tools-hub** 作为产品入口（本阶段不强制域名 301）。

## 2. 目标与成功标准

### 2.1 目标

1. **视觉**：从「神秘占卜站」切换为「干净现代工具站」（Notion / Linear / Vercel 气质）。
2. **入口**：`chatgpt-tarot-divination` 前端即唯一主站；工具市场与顶栏导航清晰一致。
3. **第一刀**：Design Token + 平台壳（`MainLayout` + 市场页）；业务逻辑零改动为原则。

### 2.2 成功标准（可验收）

- [ ] 打开首页/市场：无大面积神秘光晕与强氛围渐变；整体中性、清晰。
- [ ] 顶栏、市场卡片、主内容容器样式统一（浅色 / 深色均成立）。
- [ ] 登录、订阅、打开 iframe 工具、配额拦截等**行为与现网一致**。
- [ ] 文档标明：主站入口为本仓库前端；`tools-hub` 已退役。

### 2.3 非目标（本阶段明确不做）

| 不做 | 原因 |
|------|------|
| 将 auth 剥离到 hub | hub 将退役；跨应用会话成本高 |
| 跨应用 SSO / 会话中心 | 无第二产品壳需要 |
| 将 tarot 改成纯内嵌工具页 | 本阶段它就是壳 |
| 用 vinext 重写前端 | 违背最小成本 |
| 修改配额 / PayPal / 用户 API | 非视觉目标 |
| 逐页重画全部占卜交互 | 二期；本阶段仅要求在壳内不突兀 |
| 强制完成 tools-hub 域名 301 | 可另开任务；本阶段以文档退役为准 |
| 引入新组件库 | 继续 shadcn/ui + Tailwind |
| 市场全文搜索 / 复杂筛选 | 二期 |

## 3. 产品形态与架构

```
用户浏览器
    │
    ▼
chatgpt-tarot-divination 前端（唯一主站壳）
    │
    ├── 平台壳：顶栏 / 市场 / 账号入口 / 订阅入口 / 主题与语言
    ├── 内置工具：占卜等 React 页面（业务逻辑基本不动）
    └── 嵌入工具：iframe（PDF / 图片 / 开发 / SEO 等）
            │
            ▼
        现有 FastAPI 后端（auth / JWT / 配额 / 订阅 全部保留）
```

| 仓库 | 本阶段角色 |
|------|------------|
| `chatgpt-tarot-divination` | 唯一产品前端 + 后端 |
| `tools-hub` | 退役；不迭代；README 标明 Deprecated |

## 4. 视觉系统

### 4.1 气质

**干净、克制、工具感**：白/浅灰底、细边框、轻阴影、清晰层级。不强调玄学氛围。占卜是品类之一，不是整站主题。

### 4.2 Design Token

落点：`frontend/src/index.css`（必要时同步 `frontend/tailwind.config.js`）。

| 维度 | 浅色方向 | 深色方向 | 说明 |
|------|----------|----------|------|
| 背景 | 近白 `hsl(0 0% 98%)` | 近黑 | 去掉蓝紫大渐变底 |
| 表面 / 卡片 | 纯白 | 深灰表面 | 实色面，少用 `via-primary/5` 类渐变 |
| 文字 | 近黑 + 中灰次级 | 近白 + 中灰次级 | 标题 > 正文 > 辅助 |
| Primary | 中性蓝（可保留现有色相，降饱和与使用面积） | 同色相略提亮 | 用于按钮、链接、焦点；少大面积铺色 |
| 边框 | 浅灰 `1px` | 深灰 `1px` | 卡片主要靠边框 |
| 圆角 | `0.5rem`–`0.75rem`（从当前 `1rem` 收敛） | 同 | 更产品工具感 |
| 阴影 | 极轻或无；hover 微起 | 几乎无 | 去掉强 glow |

**删除或弱化的现状装饰：**

- `MainLayout` 中 fixed 光晕球（`blur` + `animate-pulse`）
- `bg-gradient-to-br ... to-primary/5` 整页氛围底
- 仅为「神秘感」服务的装饰性 `Sparkles` 等（可收敛为可选小图标或去掉）

### 4.3 壳层组件规范

**顶栏（Header）**

- 粘顶；高度约 56–64px
- 左：Logo / 中性产品名 + 回市场
- 右：配额摘要（若有）| 订阅 | 登录或账号 | 语言 | 主题
- 底边 `1px` 边框；surface 背景；不用半透明大毛玻璃炫光
- iframe 工具页可更扁，但**同一套组件**

**主内容区**

- 最大宽度约 1200–1280px 居中
- 背景 = token 背景色

**工具市场**

- 分类标题统一字号字重 + 工具卡片网格
- 卡片：图标 + 名称 + 一行描述；`border` + 轻 hover；统一高度与间距
- 不在卡片上堆渐变边、闪动、大面积 primary 底

**按钮与状态**

- Primary：主 CTA
- Ghost / Secondary：次要操作
- 禁用 / 加载：统一 opacity + spinner（与市场「打开中」一致）

**深色模式**

- 同一结构，只换 token；避免高饱和光晕撑气氛

### 4.4 应用优先级

| 优先级 | 落点 | 深度 |
|--------|------|------|
| P0 | `index.css` token | 全站底色 / 圆角 / 边框 |
| P0 | `MainLayout` 顶栏 + 背景 | 一进站定调 |
| P0 | `Market` 分区 + 卡片 | 主入口页 |
| P1 | 登录 / 注册 / 订阅页外壳 | 对齐 token 与卡片规范；表单逻辑不改 |
| P2 | 各占卜页内部 | 仅去掉明显冲突装饰；交互二期 |

## 5. 信息架构与导航

### 5.1 工具类型（保持现有模型）

| 类型 | 例子 | 路径 | 实现 |
|------|------|------|------|
| 内置 | 塔罗、八字、解梦… | 市场 → 工具页 | `type: 'internal'` + React 路由 |
| 嵌入 | PDF / 图片 / 开发 / SEO | 市场 → 配额校验 → iframe | `type: 'iframe'` + `/tool/:id` |

工具注册继续使用 `frontend/src/config/tools.ts`；本阶段不改数据模型。

### 5.2 用户可见站点地图

```
/                     → 市场（工具首页，主入口）
/tool/:id             → iframe 工具
/divination/* 等      → 内置占卜（现有 path 保持）
/auth/*               → 登录注册找回验证
/subscription         → 订阅
/account              → 账号（若已有）
/history、/settings…  → 次要页，壳对齐即可
```

原则：

- 市场 = 首页主心智
- 旧 path 尽量不删不改
- 顶栏 Logo / 产品名 → `/`

### 5.3 顶栏信息架构

**左：** 中性产品名（如「智能工具矩阵」或既有品牌名；避免只写「塔罗」）→ 回市场  

**右（从左到右）：** 配额摘要 → 订阅 → 登录或账号下拉 → 语言 → 主题  

iframe 工具内仍保留同一顶栏（可更紧凑）。

### 5.4 市场页结构

```
[ 可选：简短页头 —— 一句话产品说明，不要大 hero 神秘图 ]
[ 分类 1 标题 ]
  [ 工具卡 ] [ 工具卡 ] …
[ 分类 2 标题 ]
  …
```

本阶段做：分类清晰、卡片统一、点击行为与现网一致（含配额）、加载/失败体验统一、文案语气中性。  

本阶段不做：全文搜索、复杂筛选/标签、从 tools-hub 搬运 SEO 多语言 URL 树、重构分类 taxonomy。

### 5.5 文案边界

- 壳层、市场、设置：工具站语气
- 占卜工具内部文案可暂时保留原说法；本阶段不强行「去玄学化」每一句

### 5.6 tools-hub 退役

| 项 | 本阶段做法 |
|----|------------|
| 产品角色 | 不再作为用户入口，不再迭代 |
| 代码仓库 | 保留；根 README 写明 Deprecated，入口见 tarot 主站 |
| 反链 | tarot 侧不引导用户去 hub |
| 域名 301 | 可选后续任务，非本阶段验收门禁 |
| vinext / ChatGPT Sites auth helper | 与主站 JWT 无关；随 hub 搁置 |

## 6. 数据流（行为不变）

```
市场点击 iframe 工具
  → POST /api/v1/quota/consume (Bearer JWT | guest)
  → 成功：navigate /tool/:id
  → daily_limit_reached：navigate /subscription
  → 其它错误：toast

顶栏登录 / 订阅
  → 现有路由 /auth/*、/subscription
  → 全局 store 中的 jwt / settings 不变
```

**约束：** 视觉改动不得修改上述分支条件；若为改 class 触及 handler，必须行为回归。

iframe `postMessage` / `embedded=1` / `theme` / `lang` 协议保持现状（除非 padding 必须微调）。

## 7. 实现落点

| 区域 | 预期路径 | 改什么 | 不改什么 |
|------|----------|--------|----------|
| Design token | `frontend/src/index.css`，必要时 `tailwind.config.js` | 背景/表面/边框/圆角/阴影 | 业务 API |
| 壳布局 | `frontend/src/layouts/MainLayout.tsx` | 去光晕与重渐变；顶栏；主栏最大宽度 | 广告位逻辑可保留但样式收敛；配额/登录状态读取 |
| 市场 | `frontend/src/pages/Market.tsx` | 分区标题、卡片网格、hover/加载态 | `quota/consume` 与跳转逻辑 |
| 配置 / 文案 | `frontend/src/config/tools.ts`、`frontend/src/i18n/**` | 必要时中性文案微调 | 工具 id、type、iframeUrl 模型 |
| 次要页外壳 | auth / subscription / account 等 | class 对齐 | 表单、JWT、PayPal |
| 文档 | 本仓库 `README.md`；`tools-hub/README.md` | 主入口与 Deprecated 说明 | 不强制删除 hub 代码 |

### 7.1 建议施工顺序

1. Token 落地  
2. `MainLayout` 壳  
3. `Market`  
4. auth / 订阅等外壳扫一遍  
5. 文档 + tools-hub Deprecated 说明  

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 只改 token，布局仍像占卜站 | 以 MainLayout + Market 为 P0 |
| 深色模式对比度不足 | token 成对定义；手测顶栏/卡片/按钮 |
| 改 Market 误伤配额 | 不重构 `handleToolClick`；手测清单锁行为 |
| iframe 顶栏高度变化 | 接受可视区变化；保持可回市场 |
| 品牌名仍像「仅塔罗」 | 顶栏中性产品名；README 同步 |
| tools-hub 域名残留流量 | README 退役 + 后续可选 301 |

## 9. 测试要点

### 9.1 手工必测

- [ ] 浅色 / 深色：市场、顶栏、登录页、订阅页  
- [ ] 未登录打开内置工具 / iframe 工具（配额与现网一致）  
- [ ] 额度用尽 → 进入订阅  
- [ ] 登录后顶栏账号态正常  
- [ ] iframe 内主题 / 语言（若现有 postMessage）仍生效  
- [ ] 移动端顶栏与市场卡片可用  

### 9.2 工程

- 前端 `pnpm lint` / `pnpm build` 通过  
- 若已有 E2E/脚本则跑通关键路径；本阶段不强制新建 E2E 框架  

## 10. 后续可选项（不在本阶段实施）

- tools-hub 域名 301 到主站  
- 市场搜索 / 筛选  
- 占卜内页视觉二期  
- 真正的多工具 auth 中台（仅当再次出现第二壳时再议）  

## 11. 决策记录

| 决策 | 选择 |
|------|------|
| 主前端底座 | `chatgpt-tarot-divination` 前端（方案 1） |
| 改造路径 | 方案 B：壳层优先 + Token |
| 视觉方向 | 干净现代工具站 |
| 第一刀重点 | 视觉统一；结构/导航跟进但不优先大改 IA |
| tools-hub | 停用 |
| auth 剥离 | 本阶段不做 |
