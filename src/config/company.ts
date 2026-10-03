/**
 * 深伯乐门户品牌配置
 * 对齐双域名架构：.cn（个人备案·内容站）+ .com.cn（企业备案·API/商业）
 * 门户域名：www.szbolent.com.cn
 */

export const companyInfo = {
  name: '深伯乐',
  fullName: '深伯乐（深圳）科技有限公司',
  chineseName: '深伯乐',
  icp: '粤ICP备2026134984号-1',
  tagline: '以工程精度交付价值，以人文视角连接未来',
  slogan: '深伯乐 — 融合科技与人文的数智企业',

  description:
    '深伯乐是一家融合现代科技与文化底蕴的数智企业。我们提供软件开发、数字化、自动化、IT 管理与 IT 外包等全方位服务，并以 AI 读诗为特色板块，让技术在诗意中落地。',

  contact: {
    email: 'hello@szbolent.com.cn',
    support: 'support@szbolent.com.cn',
    workTime: '周一至周五 9:00–18:00',
  },

  address: {
    main: {
      city: '中国',
      full: 'www.szbolent.cn',
      postcode: '',
    },
  },

  social: {
    wechat: {
      name: '深伯乐',
      qrcode: '/images/qrcode/wechat.jpg',
    },
    github: {
      name: 'szbolent',
      url: 'https://github.com/szbolent',
    },
  },

  stats: {
    foundedYear: 2026,
  },

  values: [
    {
      icon: '◆',
      title: '领域专业',
      description: '深厚的行业经验与专业技能积累',
    },
    {
      icon: '▲',
      title: '卓越品质',
      description: '工程级精度，交付高质量解决方案',
    },
    {
      icon: '●',
      title: '技术前沿',
      description: '采用最新技术与行业最佳实践',
    },
    {
      icon: '✦',
      title: '人文视角',
      description: '以文化底蕴驱动有温度的产品体验',
    },
  ],

  /** 生态资质（首页徽章 / 关于页背书共用） */
  certifications: [
    'HarmonyOS 开发者',
    '鸿蒙生态合作伙伴',
    'OpenHarmony 贡献者',
    '昇腾 ISV 认证服务商',
  ],

  partners: [
    { name: 'HarmonyOS', logo: '' },
    { name: 'OpenHarmony', logo: '' },
    { name: '昇腾', logo: '' },
  ] as Array<{ name: string; logo: string }>,
}

export const seoConfig = {
  defaultTitle: '深伯乐 — 数智企业门户',
  titleTemplate: '%s | 深伯乐',
  defaultDescription:
    '深伯乐是融合现代科技与文化底蕴的数智企业，提供软件开发、数字化、IT管理及AI读诗等全方位服务；HarmonyOS 生态与昇腾 ISV 认证服务商。',
  keywords: [
    '深伯乐',
    '数智企业',
    '软件开发',
    'AI读诗',
    '数字化转型',
    'IT服务',
    '企业门户',
    'HarmonyOS',
    '昇腾 ISV',
    '昇腾认证服务商',
  ],
  siteUrl: 'https://www.szbolent.cn',
  ogImage: '/images/og-image.jpg',
}

export const pricingPlans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    features: ['每日 10 次诗词搜索', '基础诗人浏览', '诗词收藏'],
    cta: '免费开始',
    highlighted: false,
  },
  {
    id: 'supporter',
    name: '支持者',
    price: 29,
    period: '月',
    features: ['无限诗词搜索', 'AI 诗词问答', '深度诗人分析', '去广告'],
    cta: '立即订阅',
    highlighted: true,
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    period: '月',
    features: ['支持者全部功能', 'API 调用额度 x10', '企业级 RAG 知识库', '优先客服支持'],
    cta: '升级专业版',
    highlighted: false,
  },
]

export default {
  company: companyInfo,
  seo: seoConfig,
  pricing: pricingPlans,
}
