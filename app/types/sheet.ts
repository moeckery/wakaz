export type SheetSnap = 'partial' | 'full'

export interface SheetOptions {
  /** Allowed heights. The first is the default opening height. */
  snaps?: readonly SheetSnap[]
  /** Opening height; falls back to the first allowed snap when unavailable. */
  initial?: SheetSnap
  /** Show the drag handle. False disables dragging; explicit controls still work. */
  handle?: boolean
}
