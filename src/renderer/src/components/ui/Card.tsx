import type { ReactNode } from 'react'

type CardBorderStyle = 'solid' | 'dashed'

interface CardProps {
  children: ReactNode
  borderStyle?: CardBorderStyle
  className?: string
}

export function Card({
  children,
  borderStyle = 'solid',
  className = ''
}: CardProps): React.JSX.Element {
  const borderClasses = borderStyle === 'dashed' ? 'border-2 border-dashed' : 'border border-solid'

  return (
    <div className={`rounded-card border-stroke bg-surface ${borderClasses} ${className}`}>
      {children}
    </div>
  )
}
