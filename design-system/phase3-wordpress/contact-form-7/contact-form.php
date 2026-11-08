<?php
/**
 * Contact Form 7 — 联系表单
 * 对应外包需求：联系表单 1 个，7 字段 + 验证规则
 *
 * 使用方法：
 * 1. 安装 Contact Form 7 插件
 * 2. 后台 → 联系 → 新建表单
 * 3. 将以下代码粘贴到「表单」标签页
 * 4. 将「邮件」标签页的收件人设置为 business@szbolent.com
 */

/**
 * CF7 表单 HTML 代码（粘贴到表单编辑器）
 */
?>
<!-- 以下为粘贴到 CF7 表单编辑器的代码 -->

<div class="bolent-contact-form">
    <div class="bolent-form-field">
        <label>姓名 *</label>
        [text* your-name placeholder "请输入您的姓名"]
    </div>

    <div class="bolent-form-field">
        <label>邮箱 *</label>
        [email* your-email placeholder "name@example.com"]
    </div>

    <div class="bolent-form-field">
        <label>电话</label>
        [tel your-phone placeholder "138-0000-0000"]
    </div>

    <div class="bolent-form-field">
        <label>公司名称</label>
        [text your-company placeholder "您的公司名称"]
    </div>

    <div class="bolent-form-field">
        <label>咨询类型 *</label>
        [select* your-service "软件开发" "数字化 & 数据" "自动化 & QA" "IT 管理" "AI 读诗" "IT 外包" "其他咨询"]
    </div>

    <div class="bolent-form-field">
        <label>项目预算</label>
        [select your-budget "5万以下" "5-10万" "10-30万" "30-50万" "50万以上" "待商议"]
    </div>

    <div class="bolent-form-field">
        <label>需求描述 *</label>
        [textarea* your-message placeholder "请简要描述您的项目需求..." rows:5]
    </div>

    <div class="bolent-form-field">
        [submit "发送咨询"]
    </div>
</div>

<?php
/**
 * 验证规则（粘贴到 CF7「其他设置」标签页）
 */
?>

/* 邮箱格式验证 */
[your-email* email]

/* 电话格式验证（可选） */
[your-phone* tel]

<?php
/**
 * 邮件模板（粘贴到 CF7「邮件」标签页）
 *
 * 收件人: business@szbolent.com
 * 发件人: [your-name] <[your-email]>
 * 主题: 新咨询 - [your-service] - [your-name]
 * 正文:
 */
?>

您收到一条新的网站咨询：

姓名: [your-name]
邮箱: [your-email]
电话: [your-phone]
公司: [your-company]
咨询类型: [your-service]
项目预算: [your-budget]

需求描述:
[your-message]

---
此邮件由 www.szbolent.cn 联系表单自动发送

<?php
/**
 * 附加：表单提交成功后的前端提示
 * 粘贴到 CF7「邮件」标签页底部的「提交成功消息」
 */
?>

感谢您的咨询！我们会在 24 小时内回复您。

<?php
/**
 * 附加：将 CF7 表单嵌入页面
 * 在 Contact 页面模板中调用：
 * echo do_shortcode('[contact-form-7 id="表单ID" title="Bolent 联系表单"]');
 */
?>
