# 工具矩阵壳层视觉统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `chatgpt-tarot-divination` 前端壳层从「神秘占卜站」视觉统一为「干净现代工具站」，市场与顶栏成为唯一主入口，并文档退役 `tools-hub`；auth / 配额 / 订阅行为不变。

**Architecture:** 只改前端样式与壳层布局。Design Token 落在 `frontend/src/index.css`；平台壳重写 `MainLayout` 背景与顶栏；市场卡片去掉玻璃/光晕；auth/订阅等页仅替换外壳 class。业务 handler、路由 path、API 调用一律不动。`tools-hub` 仅 README 标明 Deprecated。

**Tech Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui + framer-motion + i18next + zustand；仓库内无前端单测框架，验收以 `pnpm lint` / `pnpm build` + 手工清单为准。

**Spec:** `docs/superpowers/specs/2026-07-21-tool-matrix-shell-redesign-design.md`

## Global Constraints

- 不得修改 `handleToolClick` 的配额分支逻辑（`daily_limit_reached` → `/subscription`，成功 → `/tool/:id`）。
- 不得修改任何后端 Python、JWT 签发、PayPal 流程。
- 不得引入新 UI 组件库；继续 shadcn + Tailwind。
- 不得删除现有路由 path。
- 圆角目标：`--radius: 0.625rem`（约 10px）。
- 顶栏产品名继续用 `t('app.title')`（中文「智能工具矩阵」/ 英文「Smart Tool Matrix」已中性，本计划不强制改正文案，除非视觉任务中顺手去掉 subtitle 神秘感）。
- 提交信息遵循 conventional commits：`feat:` / `fix:` / `refactor:` / `docs:` / `style:`。
- Attribution 已全局关闭，commit 不要加 `Co-Authored-By`。

## File map

| 文件 | 职责 |
|------|------|
| `frontend/src/index.css` | Design token + 弱化神秘 utility |
| `frontend/src/layouts/MainLayout.tsx` | 壳背景、顶栏、主栏宽度、页脚 |
| `frontend/src/pages/Market.tsx` | 市场分区与工具卡片外观（逻辑不动） |
| `frontend/src/pages/auth/*.tsx` | 登录相关卡片外壳 class |
| `frontend/src/pages/subscription/SubscriptionPage.tsx` | 订阅页卡片外壳 class（局部） |
| `frontend/src/pages/account/AccountPage.tsx` | 账号页卡片外壳 class |
| `frontend/src/pages/History.tsx` | 历史页卡片外壳 class |
| `frontend/src/pages/Login.tsx` | 旧 GitHub 登录页卡片外壳（若仍挂载） |
| `frontend/src/pages/tool/IframeToolPage.tsx` | iframe 容器边框/背景对齐壳 |
| `README.md` | 标明本仓库为唯一主站入口 |
| `../tools-hub/README.md` | Deprecated 声明 |

**本阶段不改：** `frontend/src/config/tools.ts` 数据模型、`src/**/*.py`、占卜页内部交互（P2 仅在时间允许时去明显冲突 class，默认不进本计划强制任务）。

---

### Task 1: Design Token — 中性工具站色板

**Files:**
- Modify: `frontend/src/index.css`
- Test: 无自动化；用 build + 浏览器浅/深色对照

**Interfaces:**
- Consumes: 现有 CSS 变量名（`--background`、`--primary`、`--radius` 等）；Tailwind 已映射 `hsl(var(--*))`
- Produces: 同一组变量名，新取值；utility `.glass` / 渐变文字类弱化或中性化

- [ ] **Step 1: 替换 `:root` 与 `.dark` token**

将 `frontend/src/index.css` 中 `@layer base { :root { ... } .dark { ... } }` 整块替换为：

```css
@layer base {
  :root {
    /* Neutral tool-site surface (light) */
    --background: 0 0% 98%;
    --foreground: 240 10% 3.9%;

    --primary: 221 70% 48%;
    --primary-foreground: 0 0% 100%;

    --secondary: 240 5% 96%;
    --secondary-foreground: 240 6% 10%;

    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;

    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%;

    --accent: 240 5% 96%;
    --accent-foreground: 240 6% 10%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 221 70% 48%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 240 6% 6%;
    --foreground: 0 0% 98%;

    --card: 240 5% 9%;
    --card-foreground: 0 0% 98%;

    --popover: 240 5% 9%;
    --popover-foreground: 0 0% 98%;

    --primary: 217 80% 60%;
    --primary-foreground: 240 6% 6%;

    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;

    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 64%;

    --accent: 240 4% 16%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62% 40%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 4% 18%;
    --input: 240 4% 18%;
    --ring: 217 80% 60%;
  }
}
```

保留其后的 `body`、`h1–h6`、`@layer utilities` 块；**不要删** `scrollbar-hide` / `animate-in` / `fade-in`。

- [ ] **Step 2: 弱化神秘 utility**

把同一文件里的 `.glass`、`.text-gradient-gold`、`.text-gradient-mystic` 改为中性实现（避免全站残留「金/神秘渐变」）：

```css
  /* Surface panel — flat, no frosted glass mystique */
  .glass {
    @apply border border-border bg-card shadow-sm;
  }

  .text-gradient-gold {
    @apply text-foreground;
  }

  .text-gradient-mystic {
    @apply text-foreground;
  }
```

- [ ] **Step 3: 验证 build**

```bash
cd frontend && pnpm lint && pnpm build
```

Expected: lint 无新增 error；`tsc && vite build` 成功。

- [ ] **Step 4: 手工快扫**

```bash
cd frontend && pnpm dev
```

打开 `/`：底色应为近白/近黑，无强制蓝紫氛围（壳布局若仍有光晕，Task 2 再去）。切换深色：文字可读。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: neutral design tokens for tool-matrix shell"
```

---

### Task 2: MainLayout 壳 — 去光晕 + 工具站顶栏

**Files:**
- Modify: `frontend/src/layouts/MainLayout.tsx`
- Test: lint/build + 手工顶栏/配额/登录

**Interfaces:**
- Consumes: `useGlobalState()` 的 `isDark`、`toggleDark`、`settings`；`t('app.title')` 等 i18n key（不变）
- Produces: 同一 props 接口 `MainLayout({ children })`；路由与广告位逻辑保持

- [ ] **Step 1: 去掉神秘背景与玻璃顶栏**

将根容器与光晕装饰从：

```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 ...">
  <div className="fixed inset-0 -z-10 ...">
    {/* blur orbs */}
  </div>
```

改为实色底、无 orbs：

```tsx
<div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
```

（删除整个 `fixed inset-0` 装饰节点。）

- [ ] **Step 2: 收紧外层 padding 与主栏宽度**

把内容外层改为更工具站的节奏（保留广告 grid 逻辑）：

```tsx
<div className={`w-full ${isIframeTool ? 'px-2 py-2 md:px-3 md:py-2' : 'px-4 py-3 md:px-6 md:py-4'}`}>
  <div className={`grid grid-cols-1 md:grid-cols-6 ${isIframeTool ? 'gap-2' : 'gap-4'}`}>
```

主内容列：无广告时用 `max-w-6xl mx-auto w-full` 替代 `md:px-12 lg:px-24`：

```tsx
<div
  className={`flex flex-col min-h-[calc(100vh-2rem)] ${
    showAd
      ? 'md:col-span-4'
      : `md:col-span-6 w-full ${isIframeTool ? '' : 'max-w-6xl mx-auto'}`
  }`}
>
```

- [ ] **Step 3: 重写 header class 与 Logo**

`motion.header` 改为扁顶栏（粘顶、底边框、无 rounded 大卡片玻璃）：

```tsx
<motion.header
  initial={{ y: -8, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.25 }}
  className={`sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm ${
    isIframeTool ? 'mb-2 px-2 py-2' : 'mb-4 px-3 py-2.5 md:px-4'
  }`}
>
```

Logo 区去掉 `Sparkles` 脉冲光晕与 `font-serif` 渐变字，改为：

```tsx
import { CreditCard, LogIn, Moon, Sun, LayoutGrid, Zap } from 'lucide-react'
// 删除 Sparkles import

<Link to="/" className="flex min-w-0 items-center gap-2.5 group">
  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-foreground">
    <LayoutGrid className="h-4 w-4" />
  </div>
  <div className="min-w-0">
    <h1 className="truncate text-base md:text-lg font-semibold tracking-tight text-foreground">
      {t('app.title')}
    </h1>
    <p className="text-[10px] md:text-xs text-muted-foreground hidden xl:block truncate">
      {t('app.subtitle')}
    </p>
  </div>
</Link>
```

- [ ] **Step 4: 收敛操作按钮与访客提示样式**

- 订阅/登录按钮：去掉 `border-primary/30 bg-primary/5`、`bg-primary/80`，改用默认 `variant="outline"` / `variant="default"` + `className="h-9 gap-2 px-2.5"`。
- Pro 徽章、配额徽章：保留语义色，但去掉过重 glow（`bg-green-500/20` 可保留；确保 `border-border` 协调）。
- 访客 daily 提示条：

```tsx
<div className="mt-2 border-t border-border pt-2">
  <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
    {t('rateLimit.guestDaily', { limit: dailyLimit, remaining: dailyRemaining })}
  </div>
</div>
```

- 页脚：

```tsx
<footer className="mt-6 py-4 text-center text-sm text-muted-foreground border-t border-border">
  <p>{t('app.footer', { year: new Date().getFullYear() })}</p>
</footer>
```

**禁止改动：** `showAd` 计算、`adsbygoogle` effect、`settings.enable_login` 分支结构、navigate 目标 path。

- [ ] **Step 5: lint + build**

```bash
cd frontend && pnpm lint && pnpm build
```

Expected: PASS。

- [ ] **Step 6: 手工验收壳**

- `/` 顶栏：扁、有底边、Logo 无闪光
- 切换主题
- 未登录可见配额/访客提示与登录按钮
- 打开任意 `/tool/:id`（若需登录/配额，按现网）顶栏仍在且更紧凑

- [ ] **Step 7: Commit**

```bash
git add frontend/src/layouts/MainLayout.tsx
git commit -m "style: flatten MainLayout shell into tool-site header"
```

---

### Task 3: Market 页 — 统一工具卡片

**Files:**
- Modify: `frontend/src/pages/Market.tsx`
- Test: lint/build；**强制手测 iframe 配额路径**

**Interfaces:**
- Consumes: `getToolsByCategory()`、`Tool`、`handleToolClick` 现有行为
- Produces: 同一 `MarketPage` 默认导出；`handleToolClick` **字节级逻辑不变**（只改 JSX class / 装饰节点）

- [ ] **Step 1: 确认不改 handler**

打开 `Market.tsx`，`handleToolClick` 函数体（约 L31–L73）**整段原样保留**。后续步骤只改 `return (` 之后的 JSX。

- [ ] **Step 2: 替换卡片外观**

将卡片 `className` 与内部装饰改为：

```tsx
return (
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
    {categories.map((category) => (
      <section key={category.key}>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t(`category.${category.key}`)}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {category.tools.map((tool) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.id}
                variants={item}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className={`group relative h-full cursor-pointer border border-border bg-card shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md ${
                    openingToolId === tool.id ? 'pointer-events-none opacity-70' : ''
                  }`}
                  onClick={() => handleToolClick(tool)}
                  aria-busy={openingToolId === tool.id}
                >
                  <CardHeader className="relative z-10 space-y-2 p-4 md:p-5">
                    <div className="mb-1 flex items-center gap-3">
                      <div className="rounded-md border border-border bg-muted p-2.5 text-foreground transition-colors group-hover:bg-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base font-semibold tracking-tight md:text-lg">
                        {t(`${tool.id}.name`)}
                      </CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm">
                      {t(`${tool.id}.description`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 p-4 pt-0 md:p-5 md:pt-0">
                    <div className="flex items-center text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      <span className="font-medium">
                        {tool.type === 'iframe' ? tc('quota.openTool') : tc('divination.start')}
                      </span>
                      <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>
    ))}
  </motion.div>
)
```

删除：`Sparkles` import（若不再使用）、卡片内 `absolute inset-0 bg-gradient-to-br ...` 层、`hover:shadow-[0_0_30px_...]`、`font-serif`、`backdrop-blur`、`border-primary/20`、`bg-card/40`。

可选：在列表最上方加一行极简页头（无大 hero）：

```tsx
<div className="mb-2">
  <p className="text-sm text-muted-foreground">{tc('app.subtitle')}</p>
</div>
```

（`app.subtitle` 在 `common` namespace；`tc` 已是 `useTranslation('common')`。）

- [ ] **Step 3: lint + build**

```bash
cd frontend && pnpm lint && pnpm build
```

Expected: PASS。

- [ ] **Step 4: 行为回归（强制）**

在 `pnpm dev` + 后端可用环境下：

1. 点**内置**工具 → 进入对应路由，无报错  
2. 点 **iframe** 工具且额度未满 → `POST /api/v1/quota/consume` 后进入 `/tool/:id`  
3. 额度用尽 → 进入 `/subscription` 且带 limit 语义（与现网一致）  
4. 网络失败 → toast `quota.toolAccessFailed`

若任一失败：**回滚 handler 相关 diff**（本任务不应改 handler）。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Market.tsx
git commit -m "style: unify Market tool cards for clean tool-site look"
```

---

### Task 4: 次要页外壳对齐（auth / 订阅 / 账号 / 历史 / iframe 框）

**Files:**
- Modify:  
  - `frontend/src/pages/auth/LoginPage.tsx`  
  - `frontend/src/pages/auth/RegisterPage.tsx`  
  - `frontend/src/pages/auth/ForgotPasswordPage.tsx`  
  - `frontend/src/pages/auth/ResetPasswordPage.tsx`  
  - `frontend/src/pages/auth/VerifyEmailPage.tsx`  
  - `frontend/src/pages/Login.tsx`（若 Card 仍用玻璃 class）  
  - `frontend/src/pages/subscription/SubscriptionPage.tsx`（仅 Card class 局部）  
  - `frontend/src/pages/account/AccountPage.tsx`  
  - `frontend/src/pages/History.tsx`  
  - `frontend/src/pages/tool/IframeToolPage.tsx`（容器边框）
- Test: lint/build + 打开登录/订阅/账号各一眼

**Interfaces:**
- Consumes: 各页现有 form / fetch 逻辑
- Produces: 仅 className 变化；API body、navigate、token 处理不变

- [ ] **Step 1: 统一 auth 卡片外壳**

凡出现：

```tsx
className="... backdrop-blur-lg bg-card/50 shadow-xl border-primary/10"
```

或等价 `bg-card/50` + `backdrop-blur-lg` + `border-primary/10`，统一替换为：

```tsx
className="w-full max-w-md border border-border bg-card shadow-sm"
```

（保留该元素上已有的 `w-full max-w-md` 等布局类，只换「玻璃/神秘边」相关部分。）

图标圆底可从 `bg-primary/10` 改为 `border border-border bg-muted`（可选，视觉更中性）。

涉及文件至少：`LoginPage`、`RegisterPage`、`ForgotPasswordPage`、`ResetPasswordPage`、`VerifyEmailPage`、`Login.tsx`。

`RegisterPage` 中 `border-primary/20` 分隔线改为 `border-border`；`bg-card/50` 改为 `bg-card`。

- [ ] **Step 2: Account / History / Subscription 卡片**

- `AccountPage.tsx`：`border-primary/10 bg-card/60 backdrop-blur-md` → `border border-border bg-card shadow-sm`  
- `History.tsx`：玻璃 Card 同上；标题去掉 `bg-gradient-to-r from-primary ... text-transparent`，改为 `text-foreground font-semibold`  
- `SubscriptionPage.tsx`：  
  - 高亮卡 `border-primary/30 bg-primary/5` → `border border-border bg-muted`（或保留轻微 primary 仅用于「当前方案」时用 `border-primary` 实线，不要 `/5` 大铺色）  
  - 方案卡 `hover:border-primary/50` → `hover:border-foreground/20`  
  - **不要**改 PayPal 按钮 handler、plan 列表数据请求

- [ ] **Step 3: Iframe 工具容器**

`IframeToolPage.tsx` 外层：

```tsx
// 从
className="... rounded-xl border border-border/60 bg-card/35 shadow-xl backdrop-blur-md ..."
// 到
className="flex min-h-[75vh] h-[calc(100dvh-8.5rem)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
```

内层 toolbar：

```tsx
className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2.5 md:px-4"
```

**不要**改 `quota` 检查 effect、`postMessage`、`iframeUrl` 构建。

- [ ] **Step 4: lint + build**

```bash
cd frontend && pnpm lint && pnpm build
```

Expected: PASS。

- [ ] **Step 5: 手工**

- `/auth/login`、`/auth/register`：卡片实色、无毛玻璃  
- `/subscription`、`/account`（需登录）：与顶栏风格一致  
- 任意 iframe 工具框：直角感圆角、细边框  

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/src/pages/auth \
  frontend/src/pages/Login.tsx \
  frontend/src/pages/subscription/SubscriptionPage.tsx \
  frontend/src/pages/account/AccountPage.tsx \
  frontend/src/pages/History.tsx \
  frontend/src/pages/tool/IframeToolPage.tsx
git commit -m "style: align secondary pages with tool-site shell"
```

---

### Task 5: 文档收口 + tools-hub 退役说明

**Files:**
- Modify: `README.md`（本仓库根）
- Modify: `/Users/haifeng/tools-project/tools-hub/README.md`（独立 git 仓库则在该仓库提交）
- Test: 文件可读性人工检查

**Interfaces:**
- Consumes: 无代码接口
- Produces: 用户与协作者知道唯一入口与 hub 状态

- [ ] **Step 1: 更新主站 README 入口说明**

在 `chatgpt-tarot-divination/README.md` 标题段落后加入（中文即可，与全文一致）：

```markdown
## 产品入口

本仓库前端是 **智能工具矩阵** 的唯一用户主站（市场、登录、订阅、内置与 iframe 工具）。

- 请勿再将 `tools-hub` 作为产品入口维护。
- 壳层视觉以干净现代工具站为准，见 `docs/superpowers/specs/2026-07-21-tool-matrix-shell-redesign-design.md`。
```

- [ ] **Step 2: 标记 tools-hub Deprecated**

在 `tools-hub/README.md` **最顶部**插入：

```markdown
# DEPRECATED

This project is **no longer the product entry** for Smart Tool Matrix.

- Canonical app: `chatgpt-tarot-divination` (tool market, auth, subscription, embedded tools).
- Do not add features or deploy this as the primary user-facing site.
- Optional follow-up: point any remaining public hostname to the main app (301).

---
```

保留其后原 vinext 文档（便于考古）。

- [ ] **Step 3: 分别提交**

主站：

```bash
cd /Users/haifeng/tools-project/chatgpt-tarot-divination
git add README.md
git commit -m "docs: declare this app as the sole product entry"
```

tools-hub（独立 `.git`）：

```bash
cd /Users/haifeng/tools-project/tools-hub
git add README.md
git commit -m "docs: deprecate tools-hub as product entry"
```

- [ ] **Step 4: 全量验收清单（对照 spec §2.2）**

在主站 `frontend`：

```bash
pnpm lint && pnpm build
```

手工勾选：

- [ ] 首页/市场无大面积神秘光晕与强氛围渐变  
- [ ] 顶栏、市场卡片、主内容容器统一（浅/深）  
- [ ] 登录、订阅、iframe 打开、配额拦截行为与改前一致  
- [ ] README / tools-hub 已标明入口与退役  

- [ ] **Step 5: 最终确认 commit 干净**

```bash
cd /Users/haifeng/tools-project/chatgpt-tarot-divination
git status
git log --oneline -6
```

Expected: 本计划相关 commits 在列；无把 `.env` 密钥加进提交。

---

## Spec coverage (self-review)

| Spec 要求 | Task |
|-----------|------|
| Design token 中性色 / 圆角收敛 | Task 1 |
| 去 MainLayout 光晕与渐变底 | Task 2 |
| 顶栏扁、边框、中性 Logo | Task 2 |
| 市场卡片统一、无神秘 hover 光 | Task 3 |
| 配额/iframe 行为不变 | Task 3 强制手测 + Global Constraints |
| auth/订阅/账号外壳对齐 | Task 4 |
| iframe 容器样式 | Task 4 |
| 主站唯一入口文档 | Task 5 |
| tools-hub Deprecated | Task 5 |
| 不做 auth 剥离 / vinext 重写 / 搜索 | 全局非目标，无对应 task |
| 占卜内页深度重绘 | 明确二期；不在强制 task |

## Placeholder scan

- 无 TBD/TODO 步骤  
- 每个 code step 含可粘贴 class / CSS  
- 验证命令为 `pnpm lint` / `pnpm build` / `pnpm dev`  

## 非本计划范围（勿膨胀）

- 占卜页 `bg-gradient-to-r from-primary` 按钮批量去渐变（可选 follow-up）  
- `tools-hub` 域名 301  
- 市场搜索 / 新 taxonomy  
- 前端测试框架引入  

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-21-tool-matrix-shell-redesign.md`.

**两种执行方式：**

1. **Subagent-Driven（推荐）** — 每个 Task 派一个新 subagent，任务间做 review，迭代快  
2. **Inline Execution** — 本会话按 `executing-plans` 顺序执行，带检查点  

你要哪一种？
