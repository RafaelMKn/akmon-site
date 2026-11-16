import raw from './akmon.json'
import type { Categoria } from './types'

export const cats = raw.cats as Categoria[]
export const art = raw.art as string
export const spark = raw.spark as string
