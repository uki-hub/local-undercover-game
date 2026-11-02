import { create } from 'zustand'
import type { Person } from '../engine/model'
import type { Triple } from '../content/words'

type CustomDraft = { entry: Triple; aliases: string[] }
// Unsaved setup data survives panel navigation, never private match content.
export const useSetupDrafts = create<{
  player: Person | null
  customs: Record<string, CustomDraft | null>
  editPlayer: (player: Person | null) => void
  editCustom: (locale: string, draft: CustomDraft | null) => void
}>((set) => ({
  player: null,
  customs: {},
  editPlayer: (player) => set({ player }),
  editCustom: (locale, draft) => set((s) => ({ customs: { ...s.customs, [locale]: draft } })),
}))
