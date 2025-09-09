import React from 'react'
import { IconAxe, IconShovel, IconPick, IconCircleOff } from '@tabler/icons-react'

const color = '#e6e8ef'

export const AxeIcon: React.FC<{size?:number}> = ({ size = 18 }) => (
  <IconAxe size={size} stroke={1.8} color={color} aria-hidden />
)

export const ShovelIcon: React.FC<{size?:number}> = ({ size = 18 }) => (
  <IconShovel size={size} stroke={1.8} color={color} aria-hidden />
)

export const PickaxeIcon: React.FC<{size?:number}> = ({ size = 18 }) => (
  <IconPick size={size} stroke={1.8} color={color} aria-hidden />
)

export const NoneIcon: React.FC<{size?:number}> = ({ size = 18 }) => (
  <IconCircleOff size={size} stroke={1.8} color={color} aria-hidden />
)
