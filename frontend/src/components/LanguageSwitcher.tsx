import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useGlobalState } from '@/store'

interface LanguageSwitcherProps {
  showLabel?: boolean
}

export function LanguageSwitcher({ showLabel = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation('common')
  const { setLang } = useGlobalState()
  const targetLanguage = i18n.resolvedLanguage?.startsWith('zh') ? 'English' : '中文'

  const toggleLanguage = () => {
    const newLang = i18n.resolvedLanguage?.startsWith('zh') ? 'en' : 'zh'
    const isCanonicalHomepage = window.location.pathname === '/'
      || window.location.pathname === '/zh'
      || window.location.pathname === '/zh/'

    if (isCanonicalHomepage) {
      window.location.assign(newLang === 'en' ? '/' : '/zh/')
      return
    }
    i18n.changeLanguage(newLang)
    setLang(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      title={targetLanguage}
      className="h-9 gap-2 px-2.5"
    >
      <Globe className="h-5 w-5" />
      <span className={showLabel ? 'inline' : 'hidden xl:inline'}>{targetLanguage}</span>
    </Button>
  )
}
