import {
  siPython,
  siC,
  siCplusplus,
  siJavascript,
  siTypescript,
  siRacket,
  siReact,
  siNodedotjs,
  siExpress,
  siSupabase,
  siGit,
  siGithub,
  siVercel,
  siArduino,
  siUnity,
  siLeetcode,
  siClaude,
  type SimpleIcon,
} from 'simple-icons'

interface CustomIcon {
  path: string
  evenodd?: boolean
}

/* LinkedIn was removed from simple-icons; hand-drawn "in" badge. */
const LINKEDIN: CustomIcon = {
  path: 'M2 2h20v20H2zM7.7 7.05a1.65 1.65 0 1 1-3.3 0 1.65 1.65 0 0 1 3.3 0zM4.75 9.6h3v9.4h-3zM10.2 9.6h2.85v1.3h.04c.4-.75 1.37-1.55 2.82-1.55 3.02 0 3.58 1.99 3.58 4.58V19h-3v-4.5c0-1.07-.02-2.45-1.5-2.45-1.5 0-1.73 1.17-1.73 2.37V19h-3.06z',
  evenodd: true,
}

/** Tech name → brand icon. Names without a (legally shippable) logo render text-only. */
const ICONS: Record<string, SimpleIcon | CustomIcon> = {
  python: siPython,
  c: siC,
  'c++': siCplusplus,
  cplusplus: siCplusplus,
  'embedded c/c++': siCplusplus,
  javascript: siJavascript,
  typescript: siTypescript,
  racket: siRacket,
  react: siReact,
  'node.js': siNodedotjs,
  express: siExpress,
  supabase: siSupabase,
  git: siGit,
  github: siGithub,
  vercel: siVercel,
  arduino: siArduino,
  unity: siUnity,
  leetcode: siLeetcode,
  'claude code': siClaude,
  linkedin: LINKEDIN,
  // NeetCode has no simple-icons entry — renders as a text chip
}

function iconFor(name: string): SimpleIcon | CustomIcon | null {
  return ICONS[name.toLowerCase()] ?? null
}

interface BrandIconProps {
  name: string
  size?: number
}

/** Inline brand mark, inheriting the surrounding text color. */
function BrandIcon({ name, size = 14 }: BrandIconProps) {
  const icon = iconFor(name)
  if (!icon) return null
  const evenodd = 'evenodd' in icon && icon.evenodd
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={icon.path} fillRule={evenodd ? 'evenodd' : undefined} />
    </svg>
  )
}

export default BrandIcon
