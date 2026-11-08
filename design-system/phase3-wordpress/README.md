# Bolent Astra Child Theme — 部署说明

## 前置条件

1. **WordPress 6.7+**（已配置于 `docker-compose.yml`，端口 8800）
2. **Astra 免费主题**（从 wordpress.org 安装）
3. **Contact Form 7 插件**（免费）
4. **PHP 8.3+**

## 安装步骤

### 1. 安装 Astra 父主题
```
WordPress 后台 → 外观 → 主题 → 添加新主题 → 搜索 "Astra" → 安装 → 启用
```

### 2. 安装 Bolent 子主题
将 `design-system/phase3-wordpress/astra-child/` 整个目录复制到 WordPress 的 `wp-content/themes/` 下：
```bash
cp -r design-system/phase3-wordpress/astra-child /path/to/wp-content/themes/bolent-astra-child
```
然后后台 → 外观 → 主题 → 启用 "Bolent Astra Child"

### 3. 安装插件
- Contact Form 7（插件市场搜索安装）

### 4. 配置 Custom Post Types
子主题激活后自动注册 3 个 CPT：
- **服务管理**（`bolent_service`）— 后台左侧菜单出现
- **招贤纳士**（`bolent_job`）— 后台左侧菜单出现
- **成功案例**（`bolent_case`）— 后台左侧菜单出现

### 5. 配置 Contact Form 7
1. 后台 → 联系 → 新建表单
2. 将 `contact-form-7/contact-form.php` 中的表单代码粘贴到「表单」标签
3. 「邮件」标签设置收件人 `business@szbolent.com`
4. 保存后复制短代码 `[contact-form-7 id="XX"]`
5. 在 Contact 页面模板中粘贴短代码

### 6. 设置导航菜单
后台 → 外观 → 菜单 → 创建菜单，分配至：
- 主导航菜单（`primary`）
- 页脚-服务（`footer-services`）
- 页脚-探索（`footer-explore`）
- 页脚-联系（`footer-contact`）

未设置时显示默认菜单。

### 7. Astra Customizer 设置
后台 → 外观 → 自定义，按 `brand-guidelines.md` 第六章映射设置：
- Primary Color: `#0E6E6A`
- Container Width: `1200px`
- Button Radius: `8px`

### 8. 设置首页模板
1. 后台 → 页面 → 新建页面 → 模板选择 "Bolent 首页"
2. 后台 → 设置 → 阅读 → 首页显示 → 一个静态页面 → 选择刚创建的页面

## Docker 部署（本项目环境）

```bash
# 项目根目录已有 docker-compose.yml
cp .env.example .env.local
docker compose -f docker-compose.yml up -d

# WP 后台: http://localhost:8800/wp-admin
# 前台: http://localhost:8800
```

子主题挂载路径已在 `docker-compose.yml` 中通过 `POETRY_MODOWN_WP_CONTENT` 变量配置。

## 文件清单

```
astra-child/
├── style.css              # 子主题主样式（品牌色覆盖）
├── functions.php          # 核心功能（enqueue + CPT + 菜单）
├── header.php             # 自定义 Header（含移动端汉堡菜单）
├── footer.php             # 自定义 Footer（4列布局）
├── page-templates/
│   └── page-home.php      # 首页模板（读取 CPT 渲染服务卡片）
├── cpt/
│   ├── services.php       # Services CPT + 自定义字段
│   ├── careers.php        # Careers CPT + 3 个分类法
│   └── case-studies.php   # Case Studies CPT + 行业分类
└── assets/
    └── mobile-menu.js     # 移动端菜单交互
```

## 注意事项

- 子主题不依赖 ACF Pro，自定义字段使用原生 `register_post_meta` + meta box
- Header/Footer 通过 `wp_loaded` 钩子移除 Astra 默认 Header/Footer，使用自定义模板
- 首页模板自动读取 `bolent_service` CPT 数据，无数据时显示默认服务列表
- CF7 样式已在 `functions.php` 中 dequeue 默认样式，使用子主题 `style.css` 覆盖
