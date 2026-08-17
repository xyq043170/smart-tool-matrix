import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle2, ExternalLink, MonitorSmartphone, Search, Server, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { getToolsByCategory, Tool } from '@/config/tools'
import { useGlobalState } from '@/store'
import { toast } from 'sonner'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function MarketPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('tools')
  const { t: tc } = useTranslation('common')
  const { jwt, setSettings, isDark } = useGlobalState()
  const [openingToolId, setOpeningToolId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const categories = getToolsByCategory()
  const productivityCategories = categories.filter(category => category.key !== 'divination')
  const entertainmentCategory = categories.find(category => category.key === 'divination')

  const handleToolClick = async (tool: Tool) => {
    if (tool.type === 'internal' && tool.route) {
      navigate(tool.route)
    } else if (tool.type === 'external' && tool.route) {
      if (openingToolId) return
      setOpeningToolId(tool.id)
      try {
        const response = await fetch(`${API_BASE}/api/v1/quota/consume`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt || 'xxx'}`,
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          if (data?.detail?.code === 'daily_limit_reached') {
            setSettings({
              daily_usage: data.detail.used,
              daily_limit: data.detail.limit,
              daily_remaining: data.detail.remaining,
            })
            navigate('/subscription', { state: { dailyLimitReached: true } })
            return
          }
          throw new Error(`Quota request failed: ${response.status}`)
        }
        if (!data.subscribed) {
          setSettings({
            daily_usage: data.used,
            daily_limit: data.limit,
            daily_remaining: data.remaining,
          })
        }
        const url = new URL(tool.route, window.location.origin)
        url.searchParams.set('theme', isDark ? 'dark' : 'light')
        url.searchParams.set('lang', i18n.resolvedLanguage?.startsWith('zh') ? 'zh' : 'en')
        window.location.assign(url.toString())
      } catch (error) {
        console.error(error)
        toast.error(tc('quota.toolAccessFailed'))
      } finally {
        setOpeningToolId(null)
      }
    }
  }

  const ICON_COLORS: Record<string, string> = {
    divination: 'bg-[hsl(var(--violet)/0.6)] text-violet-800 dark:text-violet-200',
    document: 'bg-[hsl(var(--coral)/0.35)] text-red-800 dark:text-red-200',
    image: 'bg-[hsl(var(--blue)/0.45)] text-blue-800 dark:text-blue-200',
    developer: 'bg-[hsl(var(--mint)/0.45)] text-emerald-800 dark:text-emerald-200',
    seo: 'bg-[hsl(var(--amber)/0.45)] text-amber-800 dark:text-amber-200',
  }

  const totalToolCount = categories.reduce((sum, c) => {
    if (c.tools.length === 1 && c.tools[0].subToolCount) {
      return sum + c.tools[0].subToolCount
    }
    return sum + c.tools.length
  }, 0)

  const matchingTools = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) return []
    return categories
      .flatMap(category => category.tools)
      .filter(tool => {
        const name = t(`${tool.id}.name`)
        const description = t(`${tool.id}.description`)
        const category = t(`category.${tool.category}`)
        return `${name} ${description} ${category}`.toLocaleLowerCase().includes(query)
      })
      .slice(0, 8)
  }, [categories, searchQuery, t])

  const openCategory = (tools: Tool[]) => {
    if (tools[0]) handleToolClick(tools[0])
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-[radial-gradient(circle_at_top,hsl(var(--blue)/0.18),transparent_42%)]">
        <div className="shell py-14 text-center md:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {tc('market.toolsCount', { count: totalToolCount })}
          </div>
          <h1 className="text-[clamp(38px,6vw,64px)] font-bold leading-[1.06] tracking-[-0.055em]">
            {tc('app.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {tc('app.subtitle')}
          </p>

          <div className="relative mx-auto mt-8 max-w-2xl text-left">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={tc('market.searchPlaceholder')}
              className="h-14 w-full rounded-2xl border border-border bg-card pl-14 pr-5 text-sm shadow-[0_12px_35px_hsl(var(--shadow-soft))] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              aria-label={tc('market.searchPlaceholder')}
            />

            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
                {matchingTools.length > 0 ? matchingTools.map(tool => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm">{t(`${tool.id}.name`)}</strong>
                        <span className="block truncate text-xs text-muted-foreground">{t(`${tool.id}.description`)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )
                }) : (
                  <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                    {tc('market.noSearchResults')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category directory */}
      <section className="shell py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {tc('market.allCategories')}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {tc('market.findYourTool')}
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-relaxed text-muted-foreground md:block">
            {tc('market.categoryHint')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {productivityCategories.map((category) => {
            const tool = category.tools[0]
            const Icon = tool.icon
            const count = tool.subToolCount || category.tools.length
            const isLoading = openingToolId === tool.id
            return (
              <a
                key={category.key}
                href={tool.route}
                onClick={(event) => {
                  event.preventDefault()
                  openCategory(category.tools)
                }}
                className={`group relative flex min-h-[210px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-[0_4px_18px_hsl(var(--shadow-soft))] transition duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_14px_35px_hsl(var(--shadow-soft))] md:p-7 ${
                  isLoading ? 'pointer-events-none opacity-60' : ''
                }`}
                aria-busy={isLoading}
              >
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${ICON_COLORS[category.key] || 'bg-muted'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {tc('market.toolsCount', { count })}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{t(`category.${category.key}`)}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {category.key === 'divination' ? tc('market.divinationDesc') : t(`${tool.id}.description`)}
                </p>
                <div className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold">
                  <span>{category.key === 'divination' ? tc('market.chooseTool') : tc('quota.openTool')}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-muted transition group-hover:bg-foreground group-hover:text-background">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      <section className="shell pb-14 md:pb-20" aria-labelledby="guides-title">
        <div className="rounded-3xl border border-border bg-card p-7 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tc('market.guidesLabel')}</p>
          <h2 id="guides-title" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{tc('market.guidesTitle')}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{tc('market.guidesDesc')}</p>
          <p className="mt-3 text-sm">
            <a href="/verification.html" className="font-semibold text-primary hover:underline">{tc('market.verificationLink')}</a>
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a href="/guides/merge-pdf.html" className="rounded-2xl bg-muted/60 p-5 transition hover:bg-muted">
              <h3 className="font-bold">{tc('market.mergeGuideTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.mergeGuideDesc')}</p>
            </a>
            <a href="/compress-pdf-to-2mb" className="rounded-2xl bg-muted/60 p-5 transition hover:bg-muted">
              <h3 className="font-bold">{tc('market.compressTo2MbTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.compressTo2MbDesc')}</p>
            </a>
            <a href="/guides/compress-pdf.html" className="rounded-2xl bg-muted/60 p-5 transition hover:bg-muted">
              <h3 className="font-bold">{tc('market.compressPdfGuideTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.compressPdfGuideDesc')}</p>
            </a>
            <a href="/guides/compress-image.html" className="rounded-2xl bg-muted/60 p-5 transition hover:bg-muted">
              <h3 className="font-bold">{tc('market.imageGuideTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.imageGuideDesc')}</p>
            </a>
          </div>
        </div>
      </section>

      {entertainmentCategory && (
        <section className="shell pb-14 md:pb-20" aria-labelledby="entertainment-title">
          <div className="rounded-2xl border border-dashed border-border p-6">
            <h2 id="entertainment-title" className="font-bold">{tc('market.entertainmentTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.entertainmentDesc')}</p>
            <a href={entertainmentCategory.tools[0].route} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              {tc('market.entertainmentLink')} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      <section className="shell py-14 md:py-20" aria-labelledby="facts-title">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tc('market.factsLabel')}</p>
        <h2 id="facts-title" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{tc('market.factsTitle')}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-6">
            <strong className="text-3xl">3</strong>
            <h3 className="mt-3 font-bold">{tc('market.guestQuotaTitle')}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.guestQuotaDesc')}</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <strong className="text-3xl">5</strong>
            <h3 className="mt-3 font-bold">{tc('market.userQuotaTitle')}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.userQuotaDesc')}</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <strong className="text-3xl">$0.99–$59.99</strong>
            <h3 className="mt-3 font-bold">{tc('market.pricingFactTitle')}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.pricingFactDesc')}</p>
            <Link to="/subscription" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">{tc('market.pricingFactLink')}</Link>
          </article>
        </div>
      </section>

      <section className="shell py-14 md:py-20" aria-labelledby="processing-title">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_8px_30px_hsl(var(--shadow-soft))] md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tc('market.evidenceLabel')}</p>
          <h2 id="processing-title" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            {tc('market.evidenceTitle')}
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
            {tc('market.evidenceIntro')}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-muted/60 p-6">
              <MonitorSmartphone className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-bold">{tc('market.evidenceBrowserTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.evidenceBrowserDesc')}</p>
            </article>
            <article className="rounded-2xl bg-muted/60 p-6">
              <Server className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-bold">{tc('market.evidenceServerTitle')}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.evidenceServerDesc')}</p>
            </article>
          </div>
          <Link to="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            {tc('market.methodLink')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-y border-border bg-card/50">
        <div className="shell py-14 md:py-16">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tc('market.whyUs')}</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{tc('market.trustTitle')}</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-base font-bold">{tc('market.trust1Title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tc('market.trust1Desc')}</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-base font-bold">{tc('market.trust2Title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tc('market.trust2Desc')}</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-base font-bold">{tc('market.trust3Title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tc('market.trust3Desc')}</p>
          </article>
          </div>
        </div>
      </section>

      <section className="shell py-14 md:py-20" aria-labelledby="cross-site-title">
        <div className="rounded-3xl border border-border bg-card p-7 md:flex md:items-center md:justify-between md:gap-10 md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tc('market.crossSiteLabel')}</p>
            <h2 id="cross-site-title" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{tc('market.crossSiteTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{tc('market.crossSiteDescription')}</p>
          </div>
          <a
            href="https://aitoolpixel.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline md:mt-0"
          >
            {tc('market.crossSiteCta')}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  )
}
