'use client'

import { useEffect, useState } from 'react'
import { getTheme, setTheme, initTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initTheme()
    setThemeState(getTheme())
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  if (!mounted) {
    return (
      <button className="px-3 py-2 rounded-lg border border-border bg-card">
        <span className="text-sm">🌓</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      <span className="text-sm">{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  )
}

