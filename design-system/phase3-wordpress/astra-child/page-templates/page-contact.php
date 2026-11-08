<?php
/**
 * Template Name: Bolent 联系我们
 * 含联系信息展示 + Contact Form 7 表单
 */
if (!defined('ABSPATH')) exit;
get_header();
?>

<!-- Hero -->
<section class="bolent-hero" style="min-height:50vh;">
    <div class="bolent-hero-grid"></div>
    <div class="bolent-hero-content">
        <h1><?php echo esc_html(bolent_mod('page_contact_title1', '联系')); ?><span class="bolent-hero-highlight"><?php echo esc_html(bolent_mod('page_contact_highlight', '我们')); ?></span></h1>
        <p class="bolent-hero-subtitle"><?php echo esc_html(bolent_mod('page_contact_subtitle', '让我们一起探讨鸿蒙化方案')); ?></p>
        <p class="bolent-hero-desc"><?php echo esc_html(bolent_mod('page_contact_desc', '无论是应用迁移、硬件适配还是生态共建，我们与您并肩前行')); ?></p>
    </div>
</section>

<!-- 联系方式 + 表单 -->
<section class="bolent-section">
    <div class="bolent-container">
        <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:48px;align-items:start;">
            <!-- 联系信息 -->
            <div>
                <span class="bolent-section-eyebrow">GET IN TOUCH</span>
                <h2 class="bolent-section-title" style="text-align:left;font-size:28px;">联系方式</h2>
                <p style="color:var(--bolent-text-secondary);margin-bottom:32px;line-height:1.7;">
                    填写右侧表单或通过以下方式直接联系我们，我们会在 24 小时内回复。
                </p>

                <div style="display:flex;flex-direction:column;gap:24px;">
                    <div style="display:flex;gap:16px;align-items:flex-start;">
                        <div style="width:48px;height:48px;border-radius:12px;background:var(--bolent-primary-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <?php echo bolent_get_svg_icon('mail', 'var(--bolent-primary)'); ?>
                        </div>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;color:var(--bolent-ink);margin-bottom:4px;">邮箱</h4>
                            <p style="font-size:15px;color:var(--bolent-text-secondary);"><?php echo esc_html(bolent_mod('contact_email', 'contact@szbolent.com')); ?></p>
                        </div>
                    </div>

                    <div style="display:flex;gap:16px;align-items:flex-start;">
                        <div style="width:48px;height:48px;border-radius:12px;background:var(--bolent-primary-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <?php echo bolent_get_svg_icon('phone', 'var(--bolent-primary)'); ?>
                        </div>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;color:var(--bolent-ink);margin-bottom:4px;">电话</h4>
                            <p style="font-size:15px;color:var(--bolent-text-secondary);"><?php echo esc_html(bolent_mod('contact_phone', '+86 0755-XXXX-XXXX')); ?></p>
                        </div>
                    </div>

                    <div style="display:flex;gap:16px;align-items:flex-start;">
                        <div style="width:48px;height:48px;border-radius:12px;background:var(--bolent-primary-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <?php echo bolent_get_svg_icon('map', 'var(--bolent-primary)'); ?>
                        </div>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;color:var(--bolent-ink);margin-bottom:4px;">地址</h4>
                            <p style="font-size:15px;color:var(--bolent-text-secondary);"><?php echo esc_html(bolent_mod('contact_address', '深圳市 · 武汉市 · 中国香港')); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 联系表单 -->
            <div style="background:#fff;border:1px solid var(--bolent-border);border-radius:var(--bolent-radius-lg);padding:40px;box-shadow:var(--bolent-shadow);">
                <h3 style="font-size:22px;font-weight:700;margin-bottom:24px;color:var(--bolent-ink);">发送消息</h3>
                <?php if (function_exists('wpcf7_contact_form_tag')) : ?>
                    <?php echo do_shortcode('[contact-form-7 id="1" title="联系表单"]'); ?>
                <?php else : ?>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                        <input type="hidden" name="action" value="bolent_contact_form">
                        <div class="bolent-form-field">
                            <label>姓名 *</label>
                            <input type="text" name="name" required placeholder="您的姓名">
                        </div>
                        <div class="bolent-form-field">
                            <label>邮箱 *</label>
                            <input type="email" name="email" required placeholder="您的邮箱">
                        </div>
                        <div class="bolent-form-field">
                            <label>公司</label>
                            <input type="text" name="company" placeholder="公司名称">
                        </div>
                        <div class="bolent-form-field">
                            <label>需求描述 *</label>
                            <textarea name="message" required placeholder="请描述您的需求..."></textarea>
                        </div>
                        <button type="submit" class="bolent-btn-harmony" style="width:100%;justify-content:center;">
                            发送消息
                        </button>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
