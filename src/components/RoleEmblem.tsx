import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { Role } from '../engine/model'

export type RoleKind = Role | 'couple' | 'justice' | 'revenger' | 'mime'
const colors: Record<RoleKind, [string, string]> = {
  civilian: ['#79dda0', '#168653'],
  undercover: ['#aa9aff', '#493392'],
  white: ['#d7f4ff', '#719ebd'],
  fool: ['#ffd85a', '#ef8028'],
  couple: ['#ffa2c8', '#d83c84'],
  justice: ['#d4b5ff', '#7752c9'],
  revenger: ['#ff9990', '#c32c45'],
  mime: ['#a2dfff', '#287baa'],
}

/** Original vector emblems; role identity never depends on the cosmetic animal. */
export function RoleEmblem({ role, className = '' }: { role: RoleKind; className?: string }) {
  const id = useId(), [light, dark] = colors[role]
  return <svg className={'role-emblem ' + className} data-role={role} viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id={id} x2=".7" y2="1"><stop stopColor={light} /><stop offset="1" stopColor={dark} /></linearGradient>
    </defs>
    <circle cx="50" cy="51" r="44" fill={dark} opacity=".2" />
    <circle cx="50" cy="47" r="43" fill={`url(#${id})`} stroke="#ffffffaa" strokeWidth="3" />
    <path d="M18 39a34 34 0 0 1 43-23" stroke="#fff" strokeWidth="4" opacity=".45" fill="none" strokeLinecap="round" />
    <g stroke={dark} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {role === 'civilian' && <>
        <path d="M28 46 50 27l22 19v27H28z" fill="#fff8dc" />
        <path d="m23 47 27-24 27 24" fill="none" stroke="#67472e" strokeWidth="6" />
        <path d="M44 73V54h13v19" fill="#bd8950" /><path d="M32 50h8v10h-8z" fill="#a8e6f8" />
        <path d="M72 77V57m0 10-8-6m8 1 7-7" stroke="#ffe185" />
      </>}
      {role === 'undercover' && <>
        <path d="m28 37 7-17 26 2 12 20" fill="#25253e" /><path d="m23 39 54 4" stroke="#25253e" strokeWidth="8" />
        <path d="M28 48q22-15 44 0l-4 19-18 7-18-7z" fill="#25253e" />
        <path d="m36 51 10 2m10 0 9-2" stroke="#ffe987" strokeWidth="4" />
        <path d="m25 80 14-12 11 9 11-9 14 12" fill="#eef0ff" />
      </>}
      {role === 'white' && <>
        <path d="M26 73V43a24 24 0 0 1 48 0v31l-12-7-12 9-12-9z" fill="#fff" />
        <ellipse cx="41" cy="44" rx="3" ry="5" fill="#476383" stroke="none" />
        <ellipse cx="59" cy="44" rx="3" ry="5" fill="#476383" stroke="none" />
        <path d="M45 56q5 5 10 0" fill="none" /><path d="m70 23 5-6m-3 13 8-1" stroke="#fff" />
      </>}
      {role === 'fool' && <>
        <path d="m25 43 2-24 20 15 16-18 13 27" fill="#8243b4" />
        <path d="m47 34 4-18 12 1 3 25" fill="#f95e61" />
        <circle cx="27" cy="19" r="5" fill="#fff3ad" /><circle cx="52" cy="17" r="5" fill="#fff3ad" /><circle cx="76" cy="42" r="5" fill="#fff3ad" />
        <path d="M29 43h42v12a21 21 0 0 1-42 0z" fill="#fff2ce" />
        <path d="m37 51 4-2m17 0 4 2M40 60q10 15 20 0z" fill="#ab3547" />
        <path d="m31 75 9-6 10 10 10-10 9 6" fill="#8243b4" />
      </>}
      {role === 'couple' && <>
        <path d="M50 73 27 51C9 31 38 18 50 36c12-18 41-5 23 15z" fill="#fff0f5" />
        <path d="m25 69 50-39m-13-1 13 1-2 13M25 69l2-12m-2 12 12 1" stroke="#ffe28c" strokeWidth="5" fill="none" />
      </>}
      {role === 'justice' && <>
        <path d="M50 24v49M32 75h36M26 37l48-5M29 37 20 56h18zM71 34 62 53h18z" fill="#fff0b9" stroke="#fff0b9" strokeWidth="4" />
        <path d="M20 56q9 13 18 0m24-3q9 13 18 0" fill="#fff0b9" stroke="#fff0b9" /><circle cx="50" cy="23" r="5" fill="#fff" stroke="none" />
      </>}
      {role === 'revenger' && <>
        <path d="m24 22 39 38 10-1-1 10-7 5-7-13L22 31z" fill="#e3e9f4" />
        <path d="m76 22-39 38-10-1 1 10 7 5 7-13 36-30z" fill="#fff" />
        <path d="m25 62 12 12m26-12 12 12" stroke="#ffe097" strokeWidth="5" />
        <path d="M35 46a15 15 0 0 1 30 0v12l-9 2v7H44v-7l-9-2z" fill="#fff0df" />
        <path d="m41 48 5 3m13-3-5 3" stroke="#8f233d" strokeWidth="4" />
      </>}
      {role === 'mime' && <>
        <path d="M30 31q20-9 40 0v23q-2 21-20 26-18-5-20-26z" fill="#fff" />
        <path d="M27 33h46l-8-14H37z" fill="#23384e" />
        <path d="m38 46 6-1m12 0 6 1M42 65q8-7 16 0" stroke="#23384e" fill="none" />
        <path d="m39 52 4 7 4-7" fill="#64b9ef" stroke="none" />
      </>}
    </g>
  </svg>
}

export function RoleBadge({ role }: { role: RoleKind }) {
  const { t } = useTranslation()
  return <span className={'role-badge role-' + role}><RoleEmblem role={role} /><b>{t('roles:' + role + '.name')}</b></span>
}
