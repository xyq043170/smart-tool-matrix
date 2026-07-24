import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, CreditCard, Globe, LogOut, Mail, Moon, Sun, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGlobalState } from '@/store'

const itemClassName = cn(
  'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none',
  'transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
)

export default function AccountDropdown() {
  const { t, i18n } = useTranslation('common')
  const {
    isDark,
    toggleDark,
    settings,
    setJwt,
    setLang,
  } = useGlobalState()
  const isSubscriptionActive = settings.subscription_status === 'active'
  const targetLanguage = i18n.resolvedLanguage?.startsWith('zh') ? 'English' : '中文'

  const toggleLanguage = () => {
    const newLanguage = i18n.resolvedLanguage?.startsWith('zh') ? 'en' : 'zh'
    void i18n.changeLanguage(newLanguage)
    setLang(newLanguage)
  }

  const logOut = () => {
    setJwt('')
    window.location.href = '/'
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2.5" title={t('nav.account')}>
          <UserCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t('nav.account')}</span>
          <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 sm:block" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[100] w-64 rounded-xl border border-border/70 bg-popover p-1.5 text-popover-foreground shadow-xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-2 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-sm font-medium" title={settings.user_name}>
                {settings.user_name}
              </span>
            </div>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              isSubscriptionActive
                ? 'bg-green-500/15 text-green-500'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isSubscriptionActive ? t('subscription.pro') : t('subscription.free')}
            </span>
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />

          <DropdownMenu.Item asChild className={itemClassName}>
            <Link to="/account">
              <UserCircle className="h-4 w-4" />
              {t('nav.account')}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClassName}>
            <Link to="/subscription">
              <CreditCard className="h-4 w-4" />
              {isSubscriptionActive ? t('subscription.manage') : t('nav.pricing')}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />

          <DropdownMenu.Item className={itemClassName} onSelect={toggleLanguage}>
            <Globe className="h-4 w-4" />
            {targetLanguage}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClassName} onSelect={toggleDark}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {t('nav.toggleTheme')}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />

          <DropdownMenu.Item
            className={cn(itemClassName, 'text-destructive focus:bg-destructive/10 focus:text-destructive')}
            onSelect={logOut}
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
