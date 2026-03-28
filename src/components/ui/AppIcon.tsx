'use client'

import * as HeroIcons from '@heroicons/react/24/outline'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import * as HeroIconsSolid from '@heroicons/react/24/solid'
import React from 'react'

type IconVariant = 'outline' | 'solid'

interface IconProps {
  name: string // Changed to string to accept dynamic values
  variant?: IconVariant
  size?: number
  className?: string
  onClick?: () => void
  disabled?: boolean
  [key: string]: unknown
}

function Icon({
  name,
  variant = 'outline',
  size = 24,
  className = '',
  onClick,
  disabled = false,
  ...props
}: IconProps) {
  const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIcons
  const IconComponent = iconSet[name as keyof typeof iconSet] as React.ComponentType<React.SVGProps<SVGSVGElement>>

  if (!IconComponent) {
    return (
      <QuestionMarkCircleIcon
        width={size}
        height={size}
        className={`text-gray-400 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      />
    )
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={`${disabled ? 'cursor-not-allowed opacity-50' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  )
}

export default Icon
