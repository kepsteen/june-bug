import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface FloatingJuneBugProps {
  shouldAnimate: boolean
  onAnimationComplete: () => void
  onClick: () => void
}

export function FloatingJuneBug({
  shouldAnimate,
  onAnimationComplete,
  onClick,
}: FloatingJuneBugProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (shouldAnimate) {
      setIsAnimating(true)
      // Animation lasts 3 seconds before completing
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onAnimationComplete()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [shouldAnimate, onAnimationComplete])

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 group',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full',
        isAnimating && 'animate-bounce'
      )}
      aria-label="Open entry prompts"
    >
      <div
        className={cn(
          'relative w-16 h-16 rounded-full bg-background shadow-lg',
          'border-2 border-primary/20',
          'transition-all duration-300',
          'group-hover:border-primary/40 group-hover:shadow-xl',
          isAnimating && 'ring-4 ring-primary/30 ring-offset-2 animate-pulse'
        )}
      >
        <img
          src="/apple-touch-icon.png"
          alt="June Bug Logo"
          className="w-full h-full rounded-full p-2"
        />
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        )}
      </div>
      {isAnimating && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-lg animate-in fade-in zoom-in-95 duration-300">
            Click me for prompts! 🎯
          </div>
        </div>
      )}
    </button>
  )
}
