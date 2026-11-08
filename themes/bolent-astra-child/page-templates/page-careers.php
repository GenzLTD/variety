<?php
/**
 * Template Name: Bolent 招贤纳士
 * 读取 bolent_job CPT 渲染职位列表
 */
if (!defined('ABSPATH')) exit;
get_header();
?>

<!-- Hero -->
<section class="bolent-hero" style="min-height:50vh;">
    <div class="bolent-hero-grid"></div>
    <div class="bolent-hero-content">
        <h1><?php echo esc_html(bolent_mod('page_careers_title1', '加入 ')); ?><span class="bolent-hero-highlight"><?php echo esc_html(bolent_mod('page_careers_highlight', 'Bolent')); ?></span></h1>
        <p class="bolent-hero-subtitle"><?php echo esc_html(bolent_mod('page_careers_subtitle', '共建鸿蒙生态 · 共创智能未来')); ?></p>
        <p class="bolent-hero-desc"><?php echo esc_html(bolent_mod('page_careers_desc', '我们正在寻找对 HarmonyOS 生态充满热情的伙伴')); ?></p>
    </div>
</section>

<!-- 职位列表 -->
<section class="bolent-section">
    <div class="bolent-container">
        <div class="bolent-section-header">
            <span class="bolent-section-eyebrow">OPEN POSITIONS</span>
            <h2 class="bolent-section-title">热招职位</h2>
            <p class="bolent-section-desc">找到适合您的岗位，与我们一起推动鸿蒙生态发展</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px;">
            <?php
            $jobs = new WP_Query(array(
                'post_type' => 'bolent_job',
                'posts_per_page' => -1,
                'meta_key' => '_job_status',
                'meta_value' => 'open',
                'orderby' => 'date',
                'order' => 'DESC',
            ));

            if ($jobs->have_posts()) :
                while ($jobs->have_posts()) : $jobs->the_post();
                    $salary_min = get_post_meta(get_the_ID(), '_job_salary_min', true);
                    $salary_max = get_post_meta(get_the_ID(), '_job_salary_max', true);
                    $experience = get_post_meta(get_the_ID(), '_job_experience', true);
                    $education = get_post_meta(get_the_ID(), '_job_education', true);
                    $departments = get_the_terms(get_the_ID(), 'job_department');
                    $locations = get_the_terms(get_the_ID(), 'job_location');
                    $types = get_the_terms(get_the_ID(), 'job_type');
            ?>
                    <div style="background:#fff;border:1px solid var(--bolent-border);border-radius:var(--bolent-radius-lg);padding:28px 32px;transition:var(--bolent-transition);" onmouseover="this.style.borderColor='var(--bolent-primary-100)';this.style.boxShadow='var(--bolent-shadow)';" onmouseout="this.style.borderColor='var(--bolent-border)';this.style.boxShadow='none';">
                        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:16px;">
                            <div>
                                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:8px;color:var(--bolent-ink);">
                                    <a href="<?php the_permalink(); ?>" style="color:inherit;text-decoration:none;"><?php the_title(); ?></a>
                                </h3>
                                <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:14px;color:var(--bolent-text-secondary);">
                                    <?php if ($departments && !is_wp_error($departments)) : ?>
                                        <span>📊 <?php echo esc_html($departments[0]->name); ?></span>
                                    <?php endif; ?>
                                    <?php if ($locations && !is_wp_error($locations)) : ?>
                                        <span>📍 <?php echo esc_html($locations[0]->name); ?></span>
                                    <?php endif; ?>
                                    <?php if ($types && !is_wp_error($types)) : ?>
                                        <span>🕐 <?php echo esc_html($types[0]->name); ?></span>
                                    <?php endif; ?>
                                    <?php if ($experience) : ?>
                                        <span>💼 <?php echo esc_html($experience); ?></span>
                                    <?php endif; ?>
                                    <?php if ($education) : ?>
                                        <span>🎓 <?php echo esc_html($education); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <?php if ($salary_min && $salary_max) : ?>
                                    <div style="font-size:18px;font-weight:700;color:var(--bolent-primary);margin-bottom:8px;">
                                        ¥<?php echo esc_html(number_format($salary_min)); ?> - ¥<?php echo esc_html(number_format($salary_max)); ?>
                                    </div>
                                <?php endif; ?>
                                <a href="<?php the_permalink(); ?>" class="bolent-btn-harmony" style="padding:8px 20px;font-size:13px;">查看详情</a>
                            </div>
                        </div>
                    </div>
            <?php
                endwhile;
                wp_reset_postdata();
            else :
            ?>
                <div style="text-align:center;padding:60px 20px;color:var(--bolent-text-muted);">
                    <p style="font-size:18px;">暂无开放职位，请关注我们的招聘动态。</p>
                    <p style="margin-top:12px;">欢迎发送简历至 <a href="mailto:hr@szbolent.com" style="color:var(--bolent-primary);">hr@szbolent.com</a>，我们会主动联系您。</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- 福利待遇 -->
<section class="bolent-section" style="background:var(--bolent-bg-soft);">
    <div class="bolent-container">
        <div class="bolent-section-header">
            <span class="bolent-section-eyebrow">BENEFITS</span>
            <h2 class="bolent-section-title">福利待遇</h2>
        </div>
        <div class="bolent-features-grid">
            <div class="bolent-feature-card">
                <div class="bolent-feature-icon"><?php echo bolent_get_svg_icon('sparkles'); ?></div>
                <h4>有竞争力的薪酬</h4>
                <p>高于行业平均的薪资 + 年终奖 + 项目奖金</p>
            </div>
            <div class="bolent-feature-card">
                <div class="bolent-feature-icon"><?php echo bolent_get_svg_icon('wrench'); ?></div>
                <h4>技术成长</h4>
                <p>HarmonyOS 前沿技术实践 + 开源社区参与机会</p>
            </div>
            <div class="bolent-feature-card">
                <div class="bolent-feature-icon"><?php echo bolent_get_svg_icon('heart'); ?></div>
                <h4>关怀与福利</h4>
                <p>五险一金 + 补充医疗 + 弹性工作 + 带薪年假</p>
            </div>
            <div class="bolent-feature-card">
                <div class="bolent-feature-icon"><?php echo bolent_get_svg_icon('rocket'); ?></div>
                <h4>发展空间</h4>
                <p>清晰晋升通道 + 技术管理双通道发展</p>
            </div>
        </div>
    </div>
</section>

<!-- CTA -->
<section class="bolent-cta">
    <div class="bolent-cta-content">
        <h2>没有找到合适的岗位？</h2>
        <p>发送简历至 hr@szbolent.com，我们期待与您相遇</p>
        <a href="mailto:hr@szbolent.com" class="bolent-btn-harmony">投递简历</a>
    </div>
</section>

<?php get_footer(); ?>
