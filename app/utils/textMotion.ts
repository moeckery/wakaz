/** Shared measurements for AnimatedText. Values are CSS pixels or milliseconds. */
export const textMotion = {
  enterMs: 350,
  leaveMs: 350 * 0.65,
  enterDelayMs: 60,
  handoffMs: 100,
  catchUpMs: 140,
  maxStaggerMs: 320,
  characterStaggerMs: 20,
  wordStaggerMs: 60,
  maxAnimatedGraphemes: 40,
  cropPaddingPx: 12,
} as const

export type TextGranularity = 'word' | 'character'

export interface TextUnit {
  text: string
  /** DOM Range uses UTF-16 offsets, not code-point indices. */
  start: number
  end: number
}

export interface TextCrop {
  left: number
  right: number
  top: number
  bottom: number
  /** Logical reading order, independent of the crop's visual position in RTL. */
  index: number
}

export interface TextLayer {
  text: string
  units: TextUnit[]
  graphemeCount: number
  staggerMs: number
  width?: number
  crops?: TextCrop[]
}

interface TextLine {
  top: number
  bottom: number
  crops: TextCrop[]
}

const snapshotProperties = [
  'opacity',
  'transform',
  'filter',
  'visibility',
  'mix-blend-mode',
] as const
const snapshotTypography = [
  'width',
  'font',
  'line-height',
  'letter-spacing',
  'text-align',
  'direction',
] as const

/** Segment once; the same offsets drive counts, stagger timing, and measurement. */
export function createTextLayer(
  text: string,
  by: TextGranularity,
  segmenter?: Intl.Segmenter,
): TextLayer {
  const graphemes = segmenter
    ? [...segmenter.segment(text)].filter((part) => !/^\s+$/.test(part.segment))
    : []
  const units =
    by === 'word'
      ? [...text.matchAll(/\S+/gu)].map((match) => ({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        }))
      : graphemes.map((part) => ({
          text: part.segment,
          start: part.index,
          end: part.index + part.segment.length,
        }))
  const staggerMs = by === 'word' ? textMotion.wordStaggerMs : textMotion.characterStaggerMs
  return {
    text,
    units,
    graphemeCount: graphemes.length,
    staggerMs: Math.min(staggerMs, textMotion.maxStaggerMs / Math.max(1, units.length - 1)),
  }
}

/** Merge shared ligature boxes, then cover each line without subpixel seams. */
export function createTextCrops(
  rectangles: readonly TextCrop[],
  height: number,
  pixelGrid: { left: number; scale: number; density: number },
): TextCrop[] {
  const lines: TextLine[] = []
  for (const rectangle of rectangles) {
    let line = lines.find((line) => Math.abs(line.top - rectangle.top) < 2)
    if (!line) {
      line = { top: rectangle.top, bottom: rectangle.bottom, crops: [] }
      lines.push(line)
    }
    line.bottom = Math.max(line.bottom, rectangle.bottom)
    line.crops.push(rectangle)
  }
  lines.sort((a, b) => a.top - b.top)

  const { left, scale, density } = pixelGrid
  const halfPixel = 0.5 / (scale * density)
  const snapX = (x: number) => (Math.round((left + x * scale) * density) / density - left) / scale
  const crops: TextCrop[] = []

  lines.forEach((line, lineIndex) => {
    const distinct: TextCrop[] = []
    for (const crop of line.crops.sort((a, b) => a.left - b.left)) {
      const previous = distinct.at(-1)
      const overlap = previous
        ? Math.min(previous.right, crop.right) - Math.max(previous.left, crop.left)
        : 0
      // Fuse shared glyph boxes (e.g. lam-alef), never an ordinary joined word.
      if (
        previous &&
        overlap > 0.9 * Math.min(previous.right - previous.left, crop.right - crop.left)
      ) {
        previous.left = Math.min(previous.left, crop.left)
        previous.right = Math.max(previous.right, crop.right)
        previous.index = Math.min(previous.index, crop.index)
      } else {
        distinct.push({ ...crop })
      }
    }

    const previousLine = lines[lineIndex - 1]
    const nextLine = lines[lineIndex + 1]
    const top = previousLine ? (previousLine.bottom + line.top) / 2 : -textMotion.cropPaddingPx
    const bottom = nextLine ? (line.bottom + nextLine.top) / 2 : height + textMotion.cropPaddingPx
    const cuts = distinct
      .slice(1)
      .map((crop, index) => snapX((distinct[index]!.right + crop.left) / 2))
    distinct.forEach((crop, index) =>
      crops.push({
        ...crop,
        top,
        bottom,
        // One physical pixel of overlap closes seams without moving the original text.
        left: index ? cuts[index - 1]! - halfPixel : crop.left - textMotion.cropPaddingPx,
        right:
          index < distinct.length - 1
            ? cuts[index]! + halfPixel
            : crop.right + textMotion.cropPaddingPx,
      }),
    )
  })
  return crops
}

/** Measure the fully shaped text; crops repeat it intact, preserving Arabic joins. */
export function measureTextLayer(
  layer: TextLayer,
  element: HTMLElement | null,
): TextLayer | undefined {
  const textNode = element?.firstChild
  if (!element || textNode?.nodeType !== Node.TEXT_NODE) return
  const bounds = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  const width = Number.parseFloat(style.width)
  const height = Number.parseFloat(style.height)
  if (!width || !height || !bounds.width || !bounds.height) return

  const scaleX = bounds.width / width
  const scaleY = bounds.height / height
  const range = document.createRange()
  const rectangles: TextCrop[] = []
  layer.units.forEach((unit, index) => {
    range.setStart(textNode, unit.start)
    range.setEnd(textNode, unit.end)
    for (const rect of range.getClientRects()) {
      if (!rect.width || !rect.height) continue
      rectangles.push({
        left: (rect.left - bounds.left) / scaleX,
        right: (rect.right - bounds.left) / scaleX,
        top: (rect.top - bounds.top) / scaleY,
        bottom: (rect.bottom - bounds.top) / scaleY,
        index,
      })
    }
  })
  const crops = createTextCrops(rectangles, height, {
    left: bounds.left,
    scale: scaleX,
    density: window.devicePixelRatio || 1,
  })
  return crops.length ? { ...layer, width, crops } : undefined
}

/** Freeze AnimatedText's escaped DOM before entering catch-up mode, never caller HTML. */
export function snapshotText(element: HTMLElement | null): string {
  if (!element) return ''
  const clone = element.cloneNode(true) as HTMLElement
  const originalNodes = [element, ...element.querySelectorAll<HTMLElement>('*')]
  const clonedNodes = [clone, ...clone.querySelectorAll<HTMLElement>('*')]
  originalNodes.forEach((node, index) => {
    const style = getComputedStyle(node)
    const clonedNode = clonedNodes[index]!
    for (const property of snapshotProperties) {
      clonedNode.style.setProperty(property, style.getPropertyValue(property))
    }
    clonedNode.style.animation = 'none'
    clonedNode.style.transition = 'none'
    clonedNode.style.willChange = 'auto'
    clonedNode.removeAttribute('id')
  })
  const rootStyle = getComputedStyle(element)
  for (const property of snapshotTypography) {
    clone.style.setProperty(property, rootStyle.getPropertyValue(property))
  }
  clone.querySelectorAll('.sr-only').forEach((node) => node.remove())
  return clone.outerHTML
}
