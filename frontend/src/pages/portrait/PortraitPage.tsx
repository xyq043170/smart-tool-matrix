import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGlobalState } from '@/store'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { User, Sparkles, Loader2, LogIn, CreditCard } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const STYLES = [
  { id: 'mystical', label: 'Mystical', labelZh: '神秘幻想' },
  { id: 'eastern', label: 'Eastern', labelZh: '东方水墨' },
  { id: 'cosmic', label: 'Cosmic', labelZh: '宇宙星辰' },
  { id: 'abstract', label: 'Abstract', labelZh: '抽象艺术' },
]

export default function PortraitPage() {
  const { i18n } = useTranslation('common')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { jwt } = useGlobalState()
  const [gender, setGender] = useState('male')
  const [birthday, setBirthday] = useState('')
  const [style, setStyle] = useState('mystical')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  const isZh = i18n.language?.startsWith('zh')

  const handleGenerate = async () => {
    if (!birthday) {
      setError(isZh ? '请选择出生日期' : 'Please select your birthday')
      return
    }
    setLoading(true)
    setError('')
    setImageUrl('')
    try {
      const resp = await fetch(`${API_BASE}/api/v1/image/portrait`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender, birthday, style }),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        setError(data.detail || (isZh ? '生成失败' : 'Generation failed'))
        return
      }
      const data = await resp.json()
      setImageUrl(data.image_url)
    } catch {
      setError(isZh ? '网络错误，请重试' : 'Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  if (!jwt) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <User className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-semibold">
            {isZh ? '命运画像' : 'Destiny Portrait'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isZh ? '登录后即可生成您的专属命运画像' : 'Sign in to generate your unique destiny portrait'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={() => navigate('/auth/login')} className="gap-2">
              <LogIn className="h-4 w-4" />
              {tc('nav.login')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/subscription')} className="gap-2">
              <CreditCard className="h-4 w-4" />
              {tc('subscription.subscribe')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <User className="h-10 w-10 text-primary mx-auto" />
        <h1 className="text-2xl font-bold">{isZh ? '命运画像' : 'Destiny Portrait'}</h1>
        <p className="text-muted-foreground text-sm">
          {isZh ? '基于你的星座与生辰，生成专属命运画像' : 'Generate your unique destiny portrait based on your zodiac and birth date'}
        </p>
      </motion.div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Gender */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{isZh ? '性别' : 'Gender'}</label>
          <div className="flex gap-3">
            <Button
              variant={gender === 'male' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGender('male')}
            >
              {isZh ? '男' : 'Male'}
            </Button>
            <Button
              variant={gender === 'female' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGender('female')}
            >
              {isZh ? '女' : 'Female'}
            </Button>
          </div>
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{isZh ? '出生日期' : 'Birthday'}</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Style */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{isZh ? '风格' : 'Style'}</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <Button
                key={s.id}
                variant={style === s.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStyle(s.id)}
                className="w-full"
              >
                {isZh ? s.labelZh : s.label}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-12 text-base gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isZh ? '生成中...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {isZh ? '生成画像' : 'Generate Portrait'}
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-4 text-center"
        >
          <img
            src={imageUrl}
            alt="Destiny Portrait"
            className="w-full max-w-md mx-auto rounded-xl shadow-lg"
          />
        </motion.div>
      )}
    </div>
  )
}
