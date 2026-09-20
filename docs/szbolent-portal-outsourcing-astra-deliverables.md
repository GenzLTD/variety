# szbolent-portal UI/UX 外包决策文档
## Astra 免费主题 + 外包方交付清单与详细数据

> 生成日期：2026-07-05  
> 最后更新：2026-07-05（Storybook 过渡环境 · 双仓分工）  
> 项目：szbolent-portal（Bolent 公司门户网站）  
> 决策结论：采用 WordPress Astra 免费主题 + 外包方品牌定制方案，替代纯 Vue 3 从零开发  
> 配套文档：[looma-zervi-design-outsourcing-deliverables.md](../../looma-zervi/frontend/looma-zervi-design-outsourcing-deliverables.md) · [PAYMENT_TIER_CONTRACT.md](../../looma-zervi/docs/PAYMENT_TIER_CONTRACT.md)（定价页接 Looma）
---

## 一、背景与决策逻辑

### 1.1 现状

szbolent-portal 当前有 12 个 Vue 3 页面 + 3 个共享组件，全部从零开发。项目文件结构如下：

```
src/
├── views/          12 个页面视图
├── components/      3 个共享组件（Header, Footer, LuckyWheel）
├── layouts/         1 个布局组件（MainLayout）
├── api/             6 个 API 模块
├── router/          路由配置
└── assets/styles/   全局样式
```

### 1.2 为什么不继续用 Vue 从零开发

| 对比维度 | Vue 3 从零开发 | WordPress Astra + 外包定制 |
|---------|---------------|--------------------------|
| 开发周期 | 8-12 周 | 4-6 周 |
| 成本 | 全栈开发 + 设计 | 仅设计定制费用 |
| 内容管理 | 需要自建 CMS 或 headless WP | WordPress 原生后台，开箱即用 |
| 后续运营 | 需要开发人员维护 | 运营人员可直接发布内容 |
| Blog/Careers 动态内容 | 需要额外开发 | WordPress 原生支持 |
| 联系人表单 | 需要自建后端 | Contact Form 7 免费插件 |
| SEO | 需要 SSR/SSG 额外配置 | Astra 内置 Schema.org 结构化数据 |
| 组件验收 | 需自建 Storybook 或人工对照 | Vue 过渡壳已装 Storybook（见 §11） |

### 1.3 为什么选择 Astra 免费主题

| 评估维度 | Astra | GeneratePress | Kadence | OceanWP | Blocksy |
|---------|-------|--------------|---------|---------|---------| 
| 免费 Starter 模板数量 | **50+** | 少量 | 10+ | 15+ | 5+ |
| 企业门户模板匹配度 | **★★★★★** | ★★★★ | ★★★★ | ★★★ | ★★★ |
| 与 Elementor 兼容性 | **原生深度集成** | 兼容 | 兼容 | 兼容 | 兼容 |
| Customizer 可视化定制 | **全面** | 基础 | 全面 | 全面 | 全面 |
| 中文语言包 | **完整** | 完整 | 完整 | 完整 | 部分 |
| 免费版功能限制 | **最少** | 中等 | 中等 | 多 | 中等 |
| 活跃安装量 | **100万+** | 60万+ | 40万+ | 70万+ | 20万+ |

**Astra 的核心优势**：
- 免费版内置 Agency/Startup/Business 导入模板，一键导入后只需替换品牌色和文案
- 与 Elementor（免费版）深度集成，外包方可视化搭建复杂布局
- 原生 Custom Layouts 功能（免费），Header/Footer 可视化编辑
- 免费版支持 Custom Post Type（配合 CPT UI 插件），可构建 Careers/CaseStudy 等自定义内容类型

### 1.4 Vue 代码的定位（2026-07-05）

当前 13 个 Vue 页面 + 3 个共享组件为 **Astra 迁移前的参考实现**，不是外包最终交付物：

| 资产 | 迁移后去向 |
|------|-----------|
| 页面布局 / 区块结构 | Astra + Elementor 页面模板（Phase 3 WP 实施） |
| Header / Footer / LuckyWheel | Astra Custom Layouts 或插件替代 |
| `Pricing.vue` | **不接 ErphpDown 作主收银**；正式定价消费 Looma `/v1/payment/*`（见 `PAYMENT_TIER_CONTRACT.md`） |
| Vue Storybook | 过渡期演示共享组件，**不为 13 页全量写 Story** |

---
## 二、页面清单与 UI 组件统计

### 2.1 页面总览

| 序号 | 页面名称 | 路由 | 文件 | 代码行数 | 区块数 | 复杂度 |
|------|---------|------|------|---------|--------|--------|
| 1 | 首页 | `/` | Home.vue | 569 | 4 | ★★★★★ |
| 2 | 关于我们 | `/about` | About.vue | 387 | 5 | ★★★★ |
| 3 | 服务列表 | `/services` | Services.vue | 865 | 8 | ★★★★★ |
| 4 | 服务详情 | `/services/:slug` | ServiceDetail.vue | 578 | 4 | ★★★★ |
| 5 | 联系我們 | `/contact` | Contact.vue | 482 | 3 | ★★★★ |
| 6 | 招贤纳士 | `/careers` | Careers.vue | 1047 | 6 | ★★★★★ |
| 7 | 博客列表 | `/blog` | Blog.vue | 603 | 3 | ★★★★ |
| 8 | 博客详情 | `/blog/:slug` | BlogDetail.vue | 767 | 5 | ★★★★★ |
| 9 | 成功案例 | `/case-study` | CaseStudy.vue | 542 | 4 | ★★★★ |
| 10 | 定价方案 | `/pricing` | Pricing.vue | 89 | 2 | ★★ |
| 11 | 隐私政策 | `/privacy` | Privacy.vue | 116 | 1 | ★ |
| 12 | 用户协议 | `/terms` | Terms.vue | 32 | 1 | ★ |
| 13 | 404页面 | `*` | NotFound.vue | 71 | 1 | ★★ |

**总计**：13 个页面，47 个内容区块，总计 6,148 行 Vue 代码

### 2.2 共享组件

| 序号 | 组件名称 | 功能描述 | 响应式断点 |
|------|---------|---------|-----------|
| 1 | **Header** | 全站导航栏：Logo、导航菜单、移动端汉堡菜单、CTA 按钮 | 3 个断点 |
| 2 | **Footer** | 全站页脚：公司信息、快速链接、服务列表、社交媒体图标、版权声明 | 3 个断点 |
| 3 | **LuckyWheel** | 营销组件：幸运转盘抽奖弹窗 | 2 个断点 |
| 4 | **MainLayout** | 全局布局容器：Header + RouterView + Footer 的 flex 布局骨架 | 全响应式 |

---

## 三、UI 元素详细清单（按页面分解）

### 3.1 首页（Home.vue）— 569 行

| 区块 | UI 元素 | 数量 | 尺寸（桌面端） | 交互状态 |
|------|---------|------|-------------|---------|
| **Hero Section** | 全屏背景渐变容器 | 1 | min-height: calc(100vh - 70px) | 动态背景动画（backgroundShift 20s） |
| | 装饰性浮动圆圈 | 1 | 300×300px | float 动画 8s |
| | 背景 SVG 波浪 | 1 | full-width | CSS 动画 |
| | 叠加层 | 2 | full-cover | 静态 |
| | 副标题文字 | 1 | font-size: 20px | - |
| | 主标题（双行） | 1 | font-size: 4rem | - |
| | 描述文字 | 1 | font-size: 1.5rem | - |
| | CTA 按钮组 | 2 | min-width: 160px | hover: 填色反转 |
| | 社交媒体侧边栏 | 4 个图标 | 48×48px 圆形 | hover: scale(1.1) + 颜色反转 |
| **Services Section** | 区域标题 | 1 | font-size: 2.5rem | - |
| | 区域描述 | 1 | font-size: 1.125rem | - |
| | 服务卡片 | 6 | minmax(320px, 1fr) | hover: translateY(-8px) + 阴影 |
| | 卡片图标容器 | 6 | 80×80px 圆角16px | hover: scale(1.1) |
| | 卡片标题 | 6 | font-size: 1.5rem | - |
| | 卡片描述 | 6 | - | - |
| | "了解更多→"链接 | 6 | font-size: 15px | hover: gap 增大 |
| **Why Choose Us** | 区域标题/描述 | 1+1 | - | - |
| | 特色卡片 | 4 | minmax(250px, 1fr) | hover: translateY(-8px) |
| | 卡片 Emoji 图标 | 4 | font-size: 60px | - |
| **CTA Section** | 渐变背景容器 | 1 | padding: 100px 0 | - |
| | 标题/描述/按钮 | 1+1+1 | font-size: 2.5rem | hover: translateY(-4px) |
| **响应式适配** | md (≤992px) | — | Hero 标题 3rem, 侧边栏隐藏, 服务网格1列 | — |
| | sm (≤768px) | — | 标题 2.5rem, CTA 按钮堆叠, 网格全1列 | — |

**首页 UI 元素小计**：约 **45 个** 独立 UI 元素（不含重复文本节点），**7 种** 交互动画状态

---

### 3.2 关于我们（About.vue）— 387 行

| 区块 | UI 元素 | 数量 | 关键尺寸 |
|------|---------|------|---------|
| **Page Header** | 渐变背景 | 1 | padding: 100px 0 60px |
| | 标题 | 1 | font-size: 3rem |
| | 面包屑导航 | 3 节点 | font-size: 15px |
| **About Grid** | 图片占位 | 1 | 600×400px 占位 |
| | 服务勾选列表 | 6 项 | 2 列网格 |
| | 文字内容区 | 多段落 | 标题 + 列表 |
| **Who We Are** | 灰色背景卡片 | 1 | padding: 60px 40px |
| **Why Choose Us** | 特色卡片 | 6 | minmax(300px, 1fr) |
| **Team CTA** | 渐变 CTA | 1 | 标准尺寸 |

**关于我们 UI 元素小计**：约 **30 个**

---

### 3.3 服务列表（Services.vue）— 865 行

| 区块 | UI 元素 | 数量 | 关键数据 |
|------|---------|------|---------|
| **Hero** | 标准渐变 Hero | 1 | - |
| **Services Overview** | 服务卡片 | 6 | minmax(320px, 1fr) |
| | 每卡片：图标+标题+描述+feature列表(4项)+链接 | 6×6 | - |
| **Process Section** | 流程卡片 | 6 | minmax(250px, 1fr) |
| | 每卡片：编号浮层+图标+标题+描述 | 6×4 | 编号 font-size: 48px |
| **Tech Stack** | 技术分类区块 | 6 | - |
| | 技术标签 | 38 | padding: 10px 20px, border-radius: 20px |
| **Why Choose Us** | 优势卡片 | 6 | minmax(300px, 1fr) |
| **Cases Preview** | 案例卡片 | 3 | minmax(320px, 1fr) |
| | 每卡片：图片(200px高)+标签+标题+结果 | 3×4 | - |
| **Testimonials** | 评价卡片 | 3 | 毛玻璃效果 |
| **CTA** | 标准 CTA | 1 | 双按钮 |

**服务列表 UI 元素小计**：约 **85 个**（全站最多）

---

### 3.4 联系我們（Contact.vue）— 482 行

| 区块 | UI 元素 | 数量 | 关键尺寸 |
|------|---------|------|---------|
| **Hero** | 标准渐变 Hero | 1 | - |
| **Contact Grid** | 信息卡片 × 4 | 4 | 图标 50×50px |
| | 联系表单 | 1 | padding: 40px, border-radius: 16px |
| | 表单字段：文本×3 + 邮箱×1 + 电话×1 + 下拉×1(7选项) + 文本域×1 | 7 个字段 | - |
| | 验证错误提示 | 3 种 | 红色边框 + 文字 |
| | 提交成功提示 | 1 | 绿色背景卡片 |
| | 提交按钮 + loading 态 | 1 | - |
| **Map Section** | 地图占位区 | 1 | height: 400px |

**联系我們 UI 元素小计**：约 **30 个**，额外 **5 种** 表单交互状态（focus/error/success/loading/disabled）

---

### 3.5 招贤纳士（Careers.vue）— 1047 行

| 区块 | UI 元素 | 数量 | 关键数据 |
|------|---------|------|---------|
| **Hero** | 数据统计展示 | 3 组 | stat-value: 42px |
| **Why Join** | 福利卡片 | 8 | minmax(250px, 1fr) |
| **Job Filters** | 筛选下拉框 × 3（部门/地点/类型） | 3 | 各有 4-5 选项 |
| **Job List** | 职位卡片 | 8 | 全宽单列 |
| | 每卡片：标题+元数据(3项)+描述+要求列表(4项)+日期+按钮 | 8×7 | department-badge |
| | 空状态 | 1 | 图标 + 文字 + 重置按钮 |
| **Process Timeline** | 步骤节点 | 5 | 圆形编号 60×60px |
| **Apply Modal** | 弹窗遮罩 | 1 | fixed overlay |
| | 弹窗内容 | 1 | max-width: 600px, border-radius: 16px |
| | 表单字段 × 4 + 文件上传 × 1 | 5 | - |
| | 关闭按钮 | 1 | 圆形 40×40px |

**招贤纳士 UI 元素小计**：约 **60 个**，额外 **弹窗** 1 个 + **筛选联动** 逻辑

---

### 3.6 博客列表（Blog.vue）— 603 行

| 区块 | UI 元素 | 数量 | 关键数据 |
|------|---------|------|---------|
| **Hero** | 标准 Hero | 1 | - |
| **Filters** | 搜索框 | 1 | max-width: 600px |
| | 分类筛选按钮 | 动态 | border-radius: 20px |
| **Posts Grid** | loading spinner | 1 | 50×50px |
| | error 状态 | 1 | 重试按钮 |
| | 文章卡片 | 9/页 | 3 列 → 2 列 → 1 列 |
| | 每卡片：缩略图(16:9)+分类标签+标题+摘要+作者头像+阅读链接 | 9×6 | 作者头像 24px 圆形 |
| | 空状态 | 1 | - |
| **Pagination** | 分页组件 | 1 | 最多 5 个页码按钮 |

**博客列表 UI 元素小计**：约 **35 个**（不含动态文章数量），**4 种** 数据状态

---

### 3.7 博客详情（BlogDetail.vue）— 767 行

| 区块 | UI 元素 | 数量 | 关键尺寸 |
|------|---------|------|---------|
| **Post Header** | 面包屑 | 3 节点 | - |
| | 文章标题 | 1 | font-size: 2.5rem |
| | 作者信息（头像+名称） | 1 | 头像 40px |
| | 分类标签 | 动态 | - |
| **Featured Image** | 特色图片 | 1 | border-radius: 12px, 负margin上移 |
| **Content Grid** | 正文区 | 1 | max-width: 800px, 含 h2-h4/p/img/code/pre/blockquote 样式 |
| | 标签列表 | 动态 | border-radius: 20px |
| | 分享按钮组（微信/微博/复制链接） | 3 | - |
| | 作者侧边栏卡片 | 1 | 头像 80px |
| | 目录侧边栏 | 1 | - |
| **Related Posts** | 相关文章卡片 | 3 | 3 列网格 |
| **CTA** | 标准 CTA | 1 | - |

**博客详情 UI 元素小计**：约 **40 个**

---

### 3.8 成功案例（CaseStudy.vue）— 542 行

| 区块 | UI 元素 | 数量 | 关键尺寸 |
|------|---------|------|---------|
| **Hero** | 标准 Hero | 1 | - |
| **Filter Bar** | 行业筛选按钮 | 7 | border-radius: 25px |
| **Cases Grid** | 案例卡片 | 6 | minmax(350px, 1fr) |
| | 每卡片：图片(240px高)+hover遮罩+标签(2个)+标题+描述+数据统计(3项)+链接 | 6×8 | - |
| | 空状态 | 1 | - |
| **CTA** | 标准 CTA | 1 | - |

**成功案例 UI 元素小计**：约 **55 个**，**7 种** 筛选状态

---

### 3.9 服务详情（ServiceDetail.vue）— 578 行（6 个 slug 共享同一模板）

| 区块 | UI 元素 | 数量 | 备注 |
|------|---------|------|------|
| **Hero** | 面包屑+标题+副标题 | 1 | 6 个不同 slug 的内容动态切换 |
| **Content Grid** | 服务概述 | 1 | - |
| | 核心特点卡片 | 4 | flex 布局，圆形图标 40×40px |
| | 优势列表 | 5 | 勾选装饰 |
| | 侧边栏：联系卡片 | 1 | 渐变背景 |
| | 侧边栏：其他服务链接 | 5 | 每项hover左移 |
| **CTA** | 标准 CTA | 1 | - |

**服务详情 UI 元素小计**：约 **25 个**（× 6 个 slug = 150 个变体呈现实例）

---

### 3.10 其他页面（Pricing / Privacy / Terms / NotFound）

| 页面 | UI 元素 | 数量 |
|------|---------|------|
| **Pricing** | Hero + 3 价格卡片（含高亮标记）+ 注释 | ~15 个 |

> **定价页说明：** Vue 版为占位；Astra 实施后 Pricing 区块文案/布局由外包在 WP 搭建，**价格数字与 tier 以 Looma `GET /v1/payment/plans?region=CN` 为准**（`supporter` ¥9.9 / `pro` ¥29.9，见 `PAYMENT_TIER_CONTRACT.md`）。ErphpDown 仅用于 WP 站内 VIP，不作主产品收银。

| **Privacy** | 纯文本法律页面，9 个章节标题 + 列表 | ~20 个 |
| **Terms** | 纯文本法律页面，5 个章节 | ~10 个 |
| **NotFound** | 404 错误码(8rem) + 标题 + 描述 + 按钮 | ~5 个 |

---

## 四、UI 元素总量统计

| 分类 | 数量 |
|------|------|
| **页面总数** | 13 |
| **内容区块总数** | 47 |
| **独立 UI 元素总数** | ≈ **420 个** |
| **共享全局组件** | 4（Header, Footer, LuckyWheel, MainLayout） |
| **需要定制的 WordPress 页面模板** | 8（Home, About, Services, ServiceDetail, Contact, Careers, CaseStudy, Blog） |
| **纯文本页面** | 3（Pricing, Privacy, Terms） |
| **特殊页面** | 2（BlogDetail 动态, NotFound） |

---

## 五、UX 交互状态统计

### 5.1 全局交互状态

| 交互类型 | 出现次数 | 涉及页面 |
|---------|---------|---------|
| **Hover 悬浮效果** | 42 处卡片/按钮/链接 | 全部 |
| **Loading 加载态** | 3 处（Blog, BlogDetail, Contact 提交） | Blog, BlogDetail, Contact |
| **Empty 空状态** | 3 处（Careers 无职位, CaseStudy 无案例, Blog 无文章） | Careers, CaseStudy, Blog |
| **Error 错误态** | 2 处（Blog, BlogDetail） | Blog, BlogDetail |
| **Success 成功态** | 1 处（Contact 表单提交） | Contact |
| **Active/Focus 态** | 15+ 处（导航/筛选按钮/表单字段） | 全部 |
| **Disabled 态** | 3 处（分页首尾按钮, 提交中按钮） | Blog, Contact |
| **Modal 弹窗** | 1 处（Careers 申请弹窗） | Careers |
| **滚动动画（AOS）** | 47 处 fade-up/fade-right/fade-left/zoom-in | 全部 |
| **CSS 关键帧动画** | 3 种（float, backgroundShift, spin） | Home, Blog |
| **表单验证** | 7 字段 × 3 规则（必填/格式/长度） | Contact |
| **筛选联动** | 3 组筛选器（7+3+3 选项） | CaseStudy, Careers, Blog |
| **分页** | 1 组件（含省略逻辑） | Blog |

### 5.2 每个组件的七态覆盖要求

外包方交付的每个组件必须覆盖以下七个交互状态：

| 状态 | 示例 |
|------|------|
| **Default** | 正常展示 |
| **Hover** | 鼠标悬浮（颜色变化、阴影、位移） |
| **Active** | 点击/选中（颜色反转、缩放） |
| **Focus** | 键盘焦点（outline 边框） |
| **Disabled** | 禁用状态（降低透明度、not-allowed 光标） |
| **Loading** | 加载中（spinner、骨架屏） |
| **Empty** | 无数据（占位图标 + 引导文字） |

### 5.3 UX 流程统计

| 流程类型 | 数量 | 
|---------|------|
| 线性浏览流程（首页→服务→联系） | 1 |
| 筛选联动流程（职位/案例筛选） | 3 |
| 表单提交流程（联系我们/职位申请） | 2 |
| 搜索→结果→分页流程 | 1 |
| 弹窗交互流程 | 1 |

---

## 六、响应式设计断点与尺寸规范

### 6.1 三断点方案

| 断点名称 | 最小宽度 | 最大宽度 | 适用设备 | Grid 列数变化 |
|---------|---------|---------|---------|-------------|
| **Mobile** | 320px | 767px | 手机竖屏 | 1 列 |
| **Tablet** | 768px | 991px | 手机横屏 / 平板 | 2 列（部分 1 列） |
| **Desktop** | 992px | 1440px+ | 笔记本 / 台式机 | 3 列（部分 2 列） |

### 6.2 容器宽度

| 断点 | 容器最大宽度 | 内边距 |
|------|------------|--------|
| Desktop | 1200px | 0 |
| Tablet | 100% | 40px |
| Mobile | 100% | 20px |

### 6.3 字体尺寸规范

| 层级 | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| h1 (Hero 标题) | 48px / 3rem | 40px / 2.5rem | 32px / 2rem |
| h2 (区块标题) | 36px / 2.25rem | 30px | 28px |
| h3 (卡片标题) | 24px / 1.5rem | 22px | 20px |
| h4 | 20px / 1.25rem | 18px | 18px |
| Body | 18px / 1.125rem | 16px | 15px |
| Small | 14px / 0.875rem | 14px | 13px |

### 6.4 间距规范

| 元素 | 尺寸 |
|------|------|
| Section 上下内边距（桌面） | 100px / 80px |
| Section 上下内边距（移动） | 60px / 40px |
| Card 内边距 | 30-40px |
| Card 间距（Grid Gap） | 30-32px |
| 按钮内边距 | 12-16px × 24-48px |
| 圆角（卡片/图片） | 12-16px |
| 圆角（按钮/标签） | 8px / 25px |
| 图标容器 | 40-80px 正方形 |
| 头像（小） | 24-40px 圆形 |
| 头像（大） | 80px 圆形 |

### 6.5 品牌色板

| 变量名 | 色值 | 用途 |
|--------|------|------|
| --primary-color | #1890ff / #667eea | 主色（需统一为品牌色） |
| --gradient-start | #667eea | Hero/CTA 渐变起始 |
| --gradient-end | #764ba2 | Hero/CTA 渐变结束 |
| --text-primary | #1a1a1a / #333 | 主文字色 |
| --text-secondary | #666 / #999 | 辅助文字色 |
| --bg-light | #f8f9fa | 浅灰背景 |
| --white | #ffffff | 卡片/内容区背景 |

> ⚠️ 当前 Vue 代码中 #667eea / #764ba2 渐变为占位设计，外包方需替换为 Bolent 品牌色。

---

## 七、Astra 免费主题 + 外包方分阶段交付清单

### Phase 1：品牌设计（1-2 周，20% 款项）

| 交付物 | 数量 | 说明 |
|--------|------|------|
| 品牌情绪板（Mood Board） | 2 套方案 | 含配色方案、字体搭配、视觉风格参考 |
| 品牌色板定义 | 1 套 | 主色、辅助色、中性色、语义色（成功/警告/错误） |
| 字体方案 | 1 套 | 中文字体（如思源黑体/阿里巴巴普惠体）+ 英文字体配对 |
| 首页设计稿（Desktop） | 1 个页面 | Figma 高保真，含 4 个区块 |
| Logo 规范 | 1 份 | 含安全间距、最小尺寸、反白版本 |

### Phase 2：设计体系搭建（2-3 周，30% 款项）

| 交付物 | 量化指标 | 详细说明 |
|--------|---------|---------|
| **Figma 组件库** | ≥ 25 个组件 | 按钮（3 尺寸×3 变体）、卡片、表单字段、导航项、标签、分页、轮播等 |
| **全部页面设计稿** | 13 个页面 × 3 断点 = 39 张设计稿 | Desktop / Tablet / Mobile |
| **Design Tokens** | 1 份 CSS 变量文件 | 对应 Astra Customizer 可导入格式 |
| **交互原型** | 3 条核心流程 | 首页→服务→联系 / 博客浏览 / 职位筛选申请 |
| **组件七态文档** | 25 组件 × 7 状态 = 175 个状态截图 | 含标注说明 |

**13 个页面设计稿详情**：

| 页面 | Desktop | Tablet | Mobile | 备注 |
|------|---------|--------|--------|------|
| 首页 | ✅ | ✅ | ✅ | 含 Hero 动画标注 |
| 关于我们 | ✅ | ✅ | ✅ | - |
| 服务列表 | ✅ | ✅ | ✅ | 含筛选/卡片滚动 |
| 服务详情 | ✅ | ✅ | ✅ | 6 个 slug 用同一模板，仅换文案 |
| 联系我們 | ✅ | ✅ | ✅ | 含表单验证态 |
| 招贤纳士 | ✅ | ✅ | ✅ | 含弹窗设计 |
| 博客列表 | ✅ | ✅ | ✅ | 含分页/筛选态 |
| 博客详情 | ✅ | ✅ | ✅ | 含代码块样式 |
| 成功案例 | ✅ | ✅ | ✅ | 含筛选态 |
| 定价方案 | ✅ | ✅ | ✅ | - |
| 隐私政策 | ✅ | ✅ | ✅ | 纯文本排版 |
| 用户协议 | ✅ | ✅ | ✅ | 纯文本排版 |
| 404 页面 | ✅ | ✅ | ✅ | - |

### Phase 3：WordPress 实施（3-4 周，30% 款项）

| 交付物 | 量化指标 | 详细说明 |
|--------|---------|---------|
| **Astra 主题配置** | 1 套完整配置 | Customizer 全部设置导出（.dat 文件） |
| **Header 模板** | 1 个 | Astra Custom Layouts 构建，含移动端汉堡菜单 |
| **Footer 模板** | 1 个 | Astra Custom Layouts 构建 |
| **8 个页面模板** | 8 个 | Home, About, Services, ServiceDetail, Contact, Careers, CaseStudy, Blog（Elementor 或 Gutenberg 构建） |
| **Custom Post Type 配置** | 3 个 | Services, Careers（Jobs）, CaseStudies（CPT UI 插件） |
| **Custom Fields 配置** | 3 组 | 对应上述 3 个 CPT 的字段（ACF 免费版或直接代码） |
| **联系表单** | 1 个 | Contact Form 7，7 字段 + 验证规则 |
| **全局样式 CSS** | 1 份 | Astra 子主题的 style.css，覆盖品牌色/字体/间距 |
| **响应式测试截图** | 13 页 × 3 断点 = 39 张 | 在 Chrome/Safari/Edge/移动端微信浏览器中验证 |

### Phase 4：内容导入与验收（1-2 周，20% 款项）

| 交付物 | 说明 |
|--------|------|
| **示例内容导入** | 首页、关于我们、联系页面的真实文案 |
| **示例职位** | 8 个示例职位数据 |
| **示例案例** | 6 个示例案例数据 |
| **设计走查报告** | 像素级对比 + 偏差修正 |
| **操作手册** | WordPress 后台操作指南（中文），含如何添加文章/职位/案例/修改页面内容 |
| **源文件移交** | Figma 源文件 + Astra 配置文件 + 子主题代码 + CPT 配置导出 |

### Phase 3 补充：定价与 Looma 对接（内部 · 非 Astra 外包范围）

| 项 | 说明 |
|----|------|
| 收银真源 | looma-zervi `POST/GET /v1/payment/*` |
| portal 待办 | `looma.ts` + Pricing 页消费 API（szbenyx · 见 `PAYMENT_TIER_CONTRACT.md` §6.2） |
| Astra 外包 | 只负责 Pricing **视觉区块**；不写 tier 逻辑、不接 ErphpDown 作主路径 |

---

## 八、UI 与 UX 数量总览
### 8.1 UI 数量总计

| 类别 | 数量 |
|------|------|
| 独立页面 | 13 |
| 内容区块总数 | 47 |
| 独立 UI 元素 | ≈ 420 |
| Figma 设计稿（3 断点 × 13 页） | 39 张 |
| WordPress 需定制的页面模板 | 8 |
| 纯文本模板 | 3 |
| 全局共享组件 | 4 |
| Figma 组件库规模 | ≥ 25 个组件 |

### 8.2 UX 状态数量总计

| 类别 | 数量 |
|------|------|
| 七态覆盖（25 组件 × 7 状态） | 175 个状态设计 |
| 加载/空/错误状态 | 8 个页面涉及 |
| 表单验证规则 | 7 字段 × 3 规则 = 21 条 |
| 筛选联动 | 3 组 |
| 弹窗 | 1 个完整交互 |
| AOS 滚动动画 | 47 处 |
| 核心用户流程 | 5 条 |
| CSS 动画 | 3 种关键帧动画 |

### 8.3 尺寸规范总计

| 类别 | 范围/数值 |
|------|----------|
| 响应式断点 | 3（Mobile <768px, Tablet 768-991px, Desktop ≥992px） |
| 容器最大宽度 | 1200px |
| Hero 标题字体范围 | 32px → 48px |
| Section 内边距范围 | 40px → 100px |
| 卡片圆角 | 12-16px |
| 按钮/标签圆角 | 8px / 20px / 25px |
| Grid 列数范围 | 1 列 → 2 列 → 3 列 |
| Grid Gap 间距 | 30-32px |

---

## 九、成本估算与对比

| 方案 | 设计成本 | 开发成本 | 总工期 | 后续维护 |
|------|---------|---------|--------|---------|
| **Vue 3 从零全栈开发** | 30,000-50,000 RMB | 50,000-80,000 RMB | 8-12 周 | 需开发人员 |
| **Astra + 外包品牌定制** | 15,000-25,000 RMB | 10,000-20,000 RMB | 4-6 周 | 运营人员即可 |
| **Astra + Elementor 自主搭建** | 0 | 0（时间成本） | 取决于自身 | 运营人员即可 |

> 以上为国内市场外包参考价格区间，实际报价因团队所在城市和设计水平有浮动。

---

## 十、内部环境与 Storybook（2026-07-05）

### 10.1 portal Vue Storybook（方案 A · 过渡）

| 项 | 值 |
|----|-----|
| 版本 | Storybook **10.4.6** · `@storybook/vue3-vite` |
| 启动 | `cd szbolent-portal && npm run storybook` |
| 端口 | **6006** |
| 配置 | `.storybook/main.ts` · `preview.ts` |
| 扫描范围 | `src/**/*.stories.*` |
| 建议 | `preview.ts` 引入 `src/assets/styles/main.scss`；仅为 Header/Footer/LuckyWheel 写 Story |

**不建议：** 为 13 个 Vue 页面全量补 Story（Astra 上线后废弃）。

### 10.2 与 looma-zervi Storybook 分工

| 仓 | 端口 | 框架 | 用途 | 文档 |
|----|------|------|------|------|
| **szbolent-portal** | 6006 | Vue 3 | 门户过渡组件 | 本文 §10.1 |
| **looma-zervi/frontend** | 6007 | React | **Phase 3 · 22 个纯 UI 组件验收** | `frontend/STORYBOOK.md` |

产品 UI 外包走查以 **looma :6007** 为准；portal Storybook 仅作 Vue→WP 过渡期参考。

### 10.3 portal 内部已完成清单

| # | 交付物 | 状态 | 说明 |
|---|--------|------|------|
| 1 | Storybook 10 初始化 | ✅ | `npx storybook@latest init` · vue3-vite |
| 2 | `npm run storybook` / `build-storybook` | ✅ | `package.json` 已写入 |
| 3 | 共享组件 Story（Header/Footer/Wheel） | ⬜ | 可选 · 过渡用 |
| 4 | Astra 外包 Phase 1–4 | ⬜ | 本文 §七 为主合同范围 |
| 5 | `looma.ts` + Pricing 接 API | ⬜ | 见 `PAYMENT_TIER_CONTRACT.md` |

---

## 十一、风险提示与注意事项

1. **Astra 免费版限制**：不支持 Astra Pro 的高级 Header/Footer Builder（拖拽式）、Mega Menu、Sticky Header 等。但使用 Custom Layouts（免费功能）+ 少量 CSS 可以覆盖 szbolent-portal 的全部需求。
2. **Elementor 免费版限制**：部分高级 Widget 不可用（如 Portfolio、Forms、Slides），但可用 Gutenberg 原生区块 + 自定义 CSS 替代。
3. **品牌色统一**：当前 Vue 代码中使用的 #667eea / #764ba2 渐变为模板占位色，外包方需替换为 Bolent 品牌色，确保与 looma-zervi 产品品牌形成区分。
4. **域名与部署**：WordPress 可部署于现有 Docker Compose 环境（docker-compose.yml），域名指向保持不变。
5. **SEO 迁移**：从 Vue SPA 迁移到 WordPress 原生渲染后，SEO 会有显著提升（服务端渲染 + Astra Schema.org），但需做好 301 重定向。
6. **Storybook 分工**：Astra 外包 **不要求** Vue Storybook 交付；产品 UI 验收在 looma `frontend` Storybook（**:6007**），勿与 portal **:6006** 混淆。

---

*文档结束。本文件作为与外包方洽谈时的技术需求附件使用。*

*配套文档：`looma-zervi/frontend/looma-zervi-design-outsourcing-deliverables.md` · `looma-zervi/docs/PAYMENT_TIER_CONTRACT.md`*