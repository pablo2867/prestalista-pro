'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale })
  }

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪' },
    { code: 'en', name: 'English', flag: '🇬' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ]

  const currentLang = languages.find(l => l.code === locale) || languages[0]

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a35] transition-colors w-full">
        <span className="text-2xl">{currentLang.flag}</span>
        <span className="text-sm text-gray-300 hidden md:inline">
          {currentLang.name}
        </span>
      </button>
      
      <div className="absolute left-0 bottom-full mb-2 bg-[#1a1a25] rounded-xl border border-[#2a2a35] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px] overflow-hidden">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a35] transition-colors first:rounded-t-xl last:rounded-b-xl ${
              locale === lang.code ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-gray-300 border-l-4 border-transparent'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}