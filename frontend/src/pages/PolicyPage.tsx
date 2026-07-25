import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type PolicyKind = 'privacy' | 'terms' | 'changelog'

const content = {
  zh: {
    privacy: {
      title: '隐私政策',
      updated: '生效及最后更新：2026-07-25',
      sections: [
        ['适用范围', '本政策适用于 gotoolmatrix.com 主站的目录、账户、额度、订阅和反馈功能。PDF、图片、开发者、网站检测及传统文化娱乐工具由不同子项目提供；进入工具前请同时查看该工具页面披露的处理方式。'],
        ['我们处理的信息', '访客使用主站时，服务可能处理 IP 地址、浏览器与设备信息、请求时间、页面路径和错误日志。注册或登录时处理邮箱、显示名称、登录凭据的安全摘要及验证状态。我们不保存明文密码。'],
        ['文件与工具输入', '设计为浏览器端运行的工具通常在设备内处理文件，但这是一项架构说明，不是独立安全审计。网站检测会把用户提交的公开网址发送至检测服务；AI 辅助与传统文化娱乐功能会把用户输入发送至应用服务。请勿提交机密、受监管或不可替代的数据。'],
        ['支付、配额与第三方', '使用次数、订阅状态和到期时间会与账户或匿名访问标识关联。付款由 PayPal 等支付服务商处理；本站接收订单号、金额、币种和付款状态等履约所需信息，不接收完整银行卡资料。登录、托管、邮件、缓存和分析服务商可能按其政策处理必要数据。'],
        ['用途、保留与安全', '信息用于提供服务、执行额度、验证付款、防止滥用、排查故障和回复反馈。数据仅在实现这些目的、履行法律义务或解决争议所需期间保留。我们采取合理的技术与组织措施，但无法承诺绝对安全。'],
        ['你的选择与联系', '你可以不注册而使用当日访客额度，也可以申请查询、更正或删除账户相关信息。隐私问题请发送邮件至 905501891wang@gmail.com。请求会在核验身份后处理。'],
      ],
    },
    terms: {
      title: '服务条款',
      updated: '生效及最后更新：2026-07-25',
      sections: [
        ['接受与服务说明', '使用 Smart Tool Matrix 即表示你同意本条款。本站提供工具目录、统一入口、账户、额度与付费通行证；部分工具来自已披露的第三方开源项目。本站不是独立评测、专业咨询、安全审计或合规认证机构。'],
        ['允许的使用', '你应合法使用服务，不得攻击、绕过额度或访问控制、批量滥用、传播恶意内容、侵犯他人权利，或干扰服务和上游项目。自动化访问应遵守 robots.txt、速率限制及适用法律。'],
        ['账户与付费通行证', '你有责任保护账户凭据并确保资料准确。免费额度以页面当时显示为准。一次性通行证在所选期限后终止且不自动续费；自动续费方案会在购买页面明确标示，可按页面说明取消。价格、币种、期限和权益以结账页为准。'],
        ['退款与支付问题', '除结账页另有说明或适用法律强制要求外，数字访问权益激活后不提供任意退款。若重复扣款、未激活或金额错误，请在付款后 14 日内发送订单号至 905501891wang@gmail.com；经核验的错误付款将原路处理。'],
        ['工具结果与风险', '工具按“现状”提供。请保留原始文件并自行核验输出。不得将网站检测视为渗透测试、排名保证或合规证明，也不得把娱乐型传统文化结果用于医疗、法律、金融、安全等高风险决策。'],
        ['责任限制与变更', '在法律允许范围内，本站不对间接损失、数据丢失或依赖工具输出造成的后果负责。服务、额度和条款可能更新；重大变更会记录在更新日志并标注日期。'],
      ],
    },
    changelog: {
      title: '更新日志',
      updated: '目录内容与政策的可核验变更记录',
      sections: [
        ['2026-07-25 · 可抓取指南与主题分区', '在原始 HTML 中加入生产力工具目录快照；发布 PDF 合并与图片压缩静态指南，包含步骤、参数、FAQ、来源及结构化数据；将传统文化娱乐入口移出生产力工具主目录。'],
        ['2026-07-25 · SEO 与可信度改进', '补全核心分类、隐私政策、服务条款和更新日志的 sitemap 条目；将分类入口改为可抓取链接；增加逐页 canonical、描述和社交分享元数据；补充隐私、支付、退款与安全边界说明。'],
        ['2026-07-24 · 来源与编辑方法', '发布 About 与 llms.txt，披露 BentoPDF、sharp-web-tools、IT Tools 和 Web-Check 等项目关系，并明确第一方目录、浏览器端处理和非独立安全审计的边界。'],
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      updated: 'Effective and last updated: July 25, 2026',
      sections: [
        ['Scope', 'This policy covers the directory, account, quota, subscription and feedback features on gotoolmatrix.com. Separate projects provide the PDF, image, developer, website-inspection and traditional-culture entertainment tools. Review the processing disclosure on the active tool before use.'],
        ['Information we process', 'The service may process IP address, browser and device information, request time, page path and error logs. Registration or sign-in involves an email address, display name, a secure password representation and verification status. We do not store plaintext passwords.'],
        ['Files and tool inputs', 'Tools designed for browser execution generally process files on the device, but that is an architectural description rather than an independent security audit. Website inspection sends a submitted public URL to the inspection service. AI-assisted and entertainment features send inputs to an application service. Do not submit confidential, regulated or irreplaceable data.'],
        ['Payments, quotas and providers', 'Usage, subscription status and expiry may be associated with an account or anonymous access identifier. Payment providers such as PayPal process payment details; we receive fulfillment data such as order ID, amount, currency and status, not complete card details. Hosting, login, email, cache and analytics providers may process necessary data under their policies.'],
        ['Purpose, retention and security', 'We use information to deliver the service, enforce quotas, verify payment, prevent abuse, diagnose faults and answer feedback. Data is retained only as needed for those purposes, legal obligations or disputes. We use reasonable safeguards but cannot promise absolute security.'],
        ['Your choices and contact', 'You may use the daily guest quota without registering and may request access, correction or deletion of account information. Email privacy requests to 905501891wang@gmail.com. We verify identity before fulfilling a request.'],
      ],
    },
    terms: {
      title: 'Terms of Service',
      updated: 'Effective and last updated: July 25, 2026',
      sections: [
        ['Agreement and service', 'By using Smart Tool Matrix you agree to these terms. The site provides a tool directory, unified entry points, accounts, quotas and paid access passes. Some tools derive from disclosed third-party open-source projects. The site is not an independent reviewer, professional adviser, security auditor or certification body.'],
        ['Acceptable use', 'Use the service lawfully. Do not attack it, bypass quotas or access controls, abuse it at scale, distribute malicious content, infringe rights or interfere with the service or upstream projects. Automated access must follow robots.txt, rate limits and applicable law.'],
        ['Accounts and passes', 'You are responsible for credentials and accurate account details. Free quotas are those shown at the time of use. One-time passes end after their selected period without renewal. Auto-renewing plans are clearly identified at checkout and can be cancelled as described there. Checkout controls price, currency, duration and benefits.'],
        ['Refunds and payment issues', 'Unless checkout states otherwise or law requires it, activated digital access is not refundable for convenience. For duplicate charges, failed activation or an incorrect amount, email the order ID to 905501891wang@gmail.com within 14 days. Verified billing errors are returned through the original payment method.'],
        ['Results and risk', 'Tools are provided as is. Keep originals and verify outputs. Website inspection is not a penetration test, ranking guarantee or compliance certificate. Traditional-culture entertainment must not guide medical, legal, financial, safety or other high-stakes decisions.'],
        ['Liability and changes', 'To the extent permitted by law, the site is not liable for indirect loss, lost data or consequences of relying on tool output. Services, quotas and terms may change; material changes are dated in the changelog.'],
      ],
    },
    changelog: {
      title: 'Changelog',
      updated: 'Verifiable directory, content and policy changes',
      sections: [
        ['2026-07-25 · Crawlable guides and topic separation', 'Added a productivity-directory snapshot to the raw HTML; published static PDF-merging and image-compression guides with steps, parameters, FAQs, sources and structured data; moved traditional-culture entertainment out of the primary productivity directory.'],
        ['2026-07-25 · SEO and trust improvements', 'Added sitemap entries for core collections, privacy, terms and changelog; changed category entry points into crawlable links; added page-specific canonical, description and social metadata; documented privacy, payment, refund and security boundaries.'],
        ['2026-07-24 · Sources and editorial method', 'Published About and llms.txt, disclosed relationships to BentoPDF, sharp-web-tools, IT Tools and Web-Check, and clarified the first-party directory, browser-processing and non-audit boundaries.'],
      ],
    },
  },
} as const

export default function PolicyPage({ kind }: { kind: PolicyKind }) {
  const { i18n } = useTranslation()
  const language = i18n.language?.startsWith('zh') ? 'zh' : 'en'
  const page = content[language][kind]

  return (
    <article className="shell py-12 md:py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_hsl(var(--shadow-soft))] md:p-10">
        <p className="text-sm font-semibold text-primary">{page.updated}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{page.title}</h1>
        <div className="mt-10 space-y-9">
          {page.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link to="/about" className="font-semibold text-primary hover:underline">
            {language === 'zh' ? '查看编辑方法、来源与联系方式' : 'See editorial method, sources and contact details'}
          </Link>
        </p>
      </div>
    </article>
  )
}
