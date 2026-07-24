import { FormEvent, useState } from 'react'
import { Mail, MessageSquareText, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const FEEDBACK_EMAIL = '905501891wang@gmail.com'

export function FeedbackDialog() {
  const { t, i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [contact, setContact] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const pageUrl = window.location.href
    const subject = t('feedback.emailSubject')
    const body = [
      t('feedback.emailGreeting'),
      '',
      feedback.trim(),
      '',
      `${t('feedback.emailContact')}: ${contact.trim() || t('feedback.notProvided')}`,
      `${t('feedback.emailPage')}: ${pageUrl}`,
      `${t('feedback.emailLanguage')}: ${i18n.resolvedLanguage || i18n.language}`,
    ].join('\n')

    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="fixed bottom-5 right-4 z-40 h-11 gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 hover:bg-primary/90 md:bottom-7 md:right-7"
          aria-label={t('feedback.button')}
        >
          <MessageSquareText className="h-4 w-4" />
          <span>{t('feedback.button')}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border-primary/20 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            {t('feedback.title')}
          </DialogTitle>
          <DialogDescription>{t('feedback.description')}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">{t('feedback.messageLabel')}</Label>
            <Textarea
              id="feedback-message"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
              className="min-h-32 resize-y"
              maxLength={2000}
              required
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">{feedback.length}/2000</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-contact">{t('feedback.contactLabel')}</Label>
            <Input
              id="feedback-contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder={t('feedback.contactPlaceholder')}
              maxLength={120}
            />
          </div>

          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {t('feedback.mailHint', { email: FEEDBACK_EMAIL })}
          </p>

          <DialogFooter>
            <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={!feedback.trim()}>
              <Send className="h-4 w-4" />
              {t('feedback.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
