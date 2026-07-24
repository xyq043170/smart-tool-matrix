import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PageCardProps {
  title: string
  description: string
  children: ReactNode
  onBack?: () => void
  icon?: LucideIcon
}

export function PageCard({
  title,
  description,
  children,
  onBack,
  icon: Icon,
}: PageCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  return (
    <div className="animate-in fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-sm duration-500">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-border bg-muted/40 px-3 py-2.5 md:px-4">
        <Button
          onClick={onBack || (() => navigate('/'))}
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          aria-label={t('nav.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--violet)/0.55)] text-violet-800 dark:text-violet-200">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex min-h-[430px] items-center justify-center px-4 py-8 md:px-8 md:py-10">
        {children}
      </div>
    </div>
  )
}
