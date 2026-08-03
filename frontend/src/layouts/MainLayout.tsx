import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { CreditCard, LogIn, Moon, Sun, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/store'
import { useIsMobile } from '@/hooks'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import AccountDropdown from '@/components/account/AccountDropdown'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import { getToolsByCategory, Tool } from '@/config/tools'
import { toast } from 'sonner'

interface MainLayoutProps {
    children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const isMobile = useIsMobile()
    const { isDark, toggleDark, settings, jwt, setSettings } = useGlobalState()
    const { t } = useTranslation('common')
    const { t: tt, i18n } = useTranslation('tools')
    const categories = getToolsByCategory()
    const productivityCategories = categories.filter(category => category.key !== 'divination')
    const [navLoading, setNavLoading] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_BASE || ''

    const handleNavToolOpen = async (tool: Tool) => {
        if (navLoading) return
        if (tool.type === 'internal' && tool.route) {
            navigate(tool.route)
            return
        }
        if (tool.type !== 'external' || !tool.route) return
        setNavLoading(tool.id)
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
                setSettings({ daily_usage: data.used, daily_limit: data.limit, daily_remaining: data.remaining })
            }
            const url = new URL(tool.route, window.location.origin)
            url.searchParams.set('theme', isDark ? 'dark' : 'light')
            url.searchParams.set('lang', i18n.resolvedLanguage?.startsWith('zh') ? 'zh' : 'en')
            window.location.assign(url.toString())
        } catch (error) {
            console.error(error)
            toast.error(t('quota.toolAccessFailed'))
        } finally {
            setNavLoading(null)
        }
    }

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    const isIframeTool = location.pathname.startsWith('/tool/')
    const showAd = !isIframeTool && !isMobile && settings.ad_client && settings.ad_slot
    const isSubscriptionActive = settings.subscription_status === 'active'
    const dailyLimit = settings.daily_limit ?? (settings.user_name ? 5 : 3)
    const dailyUsed = settings.daily_usage ?? 0
    const dailyRemaining = settings.daily_remaining ?? Math.max(0, dailyLimit - dailyUsed)

    useEffect(() => {
        if (showAd && settings.fetched) {
            try {
                // @ts-ignore
                ; (window.adsbygoogle = window.adsbygoogle || []).push({})
                    // @ts-ignore
                    ; (window.adsbygoogle = window.adsbygoogle || []).push({})
            } catch (e) {
                console.error('AdSense error:', e)
            }
        }
    }, [showAd, settings.fetched])

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Site Header */}
            <header className="sticky top-0 z-50 h-[76px] border-b border-border bg-background/90 backdrop-blur-[14px]">
                <div className="shell flex h-full items-center justify-between gap-5">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-[11px] text-[19px] font-[780] tracking-[-0.04em]">
                        <span className="grid h-[28px] w-[28px] grid-cols-2 gap-[3px] rotate-[8deg]" aria-hidden="true">
                            <i className="rounded-[2px] bg-foreground" />
                            <i className="rounded-[2px] bg-[hsl(var(--coral))]" />
                            <i className="rounded-[2px] bg-[hsl(var(--blue))]" />
                            <i className="rounded-[2px] bg-[hsl(var(--acid))]" />
                        </span>
                        <span>{t('app.title')}</span>
                    </Link>

                    {/* Main Nav - desktop */}
                    {!isIframeTool && (
                        <nav className="hidden md:flex items-center gap-[26px] text-[14px] text-muted-foreground">
                            {productivityCategories.map((cat) => {
                                if (cat.tools.length === 1) {
                                    const tool = cat.tools[0]
                                    return (
                                        <a
                                            key={cat.key}
                                            href={tool.route}
                                            onClick={(event) => {
                                                event.preventDefault()
                                                handleNavToolOpen(tool)
                                            }}
                                            className="whitespace-nowrap transition-all duration-200 hover:text-foreground hover:-translate-y-[1px] disabled:opacity-50"
                                        >
                                            {tt(`categoryShort.${cat.key}`)}
                                        </a>
                                    )
                                }
                                return (
                                    <a
                                        key={cat.key}
                                        href={cat.tools[0].route}
                                        onClick={(event) => {
                                            event.preventDefault()
                                            handleNavToolOpen(cat.tools[0])
                                        }}
                                        className="whitespace-nowrap transition-all duration-200 hover:text-foreground hover:-translate-y-[1px]"
                                    >
                                        {tt(`categoryShort.${cat.key}`)}
                                    </a>
                                )
                            })}
                        </nav>
                    )}

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                        {isSubscriptionActive ? (
                            <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
                                {t('subscription.pro')}
                            </span>
                        ) : (
                            <span
                                className="hidden sm:inline-flex items-center gap-1.5 h-[36px] px-[11px] text-[12px] font-[650] rounded-[10px] border border-border bg-card shadow-[0_2px_8px_hsl(var(--shadow-soft))] text-muted-foreground"
                                title={t('quota.usedDetail', { used: dailyUsed, limit: dailyLimit })}
                            >
                                <Zap className="h-3.5 w-3.5" />
                                {dailyRemaining}/{dailyLimit}
                            </span>
                        )}

                        {settings.enable_login && (
                            settings.user_name ? (
                                <>
                                    <AccountDropdown />
                                    <Link to="/subscription" className="hidden sm:inline-flex items-center gap-1.5 h-[36px] px-[11px] text-[12px] font-[650] rounded-[10px] border border-border bg-card shadow-[0_2px_8px_hsl(var(--shadow-soft))] transition-all duration-200 hover:-translate-y-[1px] hover:border-foreground/30">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span className="hidden lg:inline">{isSubscriptionActive ? t('subscription.manage') : t('nav.pricing')}</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/subscription" className="hidden sm:inline-flex items-center gap-1.5 h-[36px] px-[11px] text-[12px] font-[650] rounded-[10px] border border-border bg-card shadow-[0_2px_8px_hsl(var(--shadow-soft))] transition-all duration-200 hover:-translate-y-[1px] hover:border-foreground/30">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span className="hidden lg:inline">{t('nav.pricing')}</span>
                                    </Link>
                                    <button onClick={() => navigate('/auth/login')} className="inline-flex items-center gap-[10px] h-[36px] px-[13px] text-[12px] font-[680] rounded-[12px] bg-foreground text-background shadow-[0_4px_12px_hsl(var(--shadow-soft))] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_7px_18px_hsl(var(--shadow-soft))]">
                                        <LogIn className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{t('nav.login')}</span>
                                    </button>
                                </>
                            )
                        )}

                        <LanguageSwitcher />
                        <button onClick={toggleDark} className="inline-flex items-center justify-center h-[36px] w-[36px] rounded-[10px] border border-border bg-card shadow-[0_2px_8px_hsl(var(--shadow-soft))] transition-all duration-200 hover:-translate-y-[1px] hover:border-foreground/30">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Guest quota banner */}
            {!settings.user_name && !isIframeTool && (
                <div className="border-b border-border bg-muted/50">
                    <div className="shell flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {t('rateLimit.guestDaily', { limit: dailyLimit, remaining: dailyRemaining })}
                    </div>
                </div>
            )}

            {/* Main content */}
            <main>
                <AnimatePresence mode="wait">
                    {children}
                </AnimatePresence>
            </main>

            {/* Footer */}
            {!isIframeTool && (
                <footer className="mt-16 border-t border-border bg-foreground text-background">
                    <div className="shell py-12">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr]">
                            <div>
                                <Link to="/" className="flex items-center gap-2.5 text-lg font-bold">
                                    <span className="grid h-6 w-6 grid-cols-2 gap-[2px] rotate-[8deg]" aria-hidden="true">
                                        <i className="rounded-[2px] bg-current" />
                                        <i className="rounded-[2px] bg-[hsl(var(--coral))]" />
                                        <i className="rounded-[2px] bg-[hsl(var(--blue))]" />
                                        <i className="rounded-[2px] bg-[hsl(var(--acid))]" />
                                    </span>
                                    <span>{t('app.title')}</span>
                                </Link>
                                <p className="mt-4 max-w-xs text-sm opacity-60">{t('app.subtitle')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="flex flex-col gap-2">
                                    <strong className="text-xs uppercase tracking-widest opacity-50">{t('market.productivityTools')}</strong>
                                    {productivityCategories.map(category => category.tools[0]).map(tool => (
                                        <a key={tool.id} href={tool.route} className="opacity-70 hover:opacity-100">{tt(`${tool.id}.name`)}</a>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <strong className="text-xs uppercase tracking-widest opacity-50">{t('nav.more') || '更多'}</strong>
                                    <Link to="/about" className="opacity-70 hover:opacity-100">{t('nav.about')}</Link>
                                    <Link to="/privacy" className="opacity-70 hover:opacity-100">{t('legal.privacy')}</Link>
                                    <Link to="/terms" className="opacity-70 hover:opacity-100">{t('legal.terms')}</Link>
                                    <Link to="/changelog" className="opacity-70 hover:opacity-100">{t('legal.changelog')}</Link>
                                    <Link to="/subscription" className="opacity-70 hover:opacity-100">{t('nav.pricing')}</Link>
                                    <Link to="/auth/login" className="opacity-70 hover:opacity-100">{t('nav.login')}</Link>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex justify-between border-t border-current/20 pt-5 text-xs opacity-50">
                            <span>{t('app.footer', { year: new Date().getFullYear() })}</span>
                        </div>
                    </div>
                </footer>
            )}

            {location.pathname !== '/subscription' && <FeedbackDialog />}
        </div>
    )
}
