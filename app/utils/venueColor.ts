type RGB = readonly [number, number, number]

const black: RGB = [0, 0, 0]
const white: RGB = [255, 255, 255]
const luminanceWeights: RGB = [0.2126, 0.7152, 0.0722]
const minimumBorderContrast = 3

export function normalizeVenueColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const hex = value.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null
  return `#${(hex.length === 3 ? [...hex].map((char) => char + char).join('') : hex).toUpperCase()}`
}

const parseHex = (hex: string): RGB => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]
const toHex = (channels: RGB) =>
  `#${channels
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
const mixColors = (from: RGB, to: RGB, amount: number): RGB => [
  Math.round(from[0] + (to[0] - from[0]) * amount),
  Math.round(from[1] + (to[1] - from[1]) * amount),
  Math.round(from[2] + (to[2] - from[2]) * amount),
]
const relativeLuminance = (channels: RGB) =>
  channels.reduce((sum, channel, index) => {
    const value = channel / 255
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    return sum + linear * luminanceWeights[index]!
  }, 0)
const contrastRatio = (firstLuminance: number, secondLuminance: number) =>
  (Math.max(firstLuminance, secondLuminance) + 0.05) /
  (Math.min(firstLuminance, secondLuminance) + 0.05)

function foregroundFor(background: RGB): RGB {
  const luminance = relativeLuminance(background)
  return contrastRatio(luminance, 0) >= contrastRatio(luminance, 1) ? black : white
}

function boundaryFor(background: RGB, canvas: RGB, foreground: RGB): RGB {
  const canvasLuminance = relativeLuminance(canvas)
  if (contrastRatio(relativeLuminance(background), canvasLuminance) >= minimumBorderContrast) {
    return mixColors(background, foreground, 0.12)
  }

  // Strengthen only a fill that blends into the canvas, checking rounded colors.
  const target = foregroundFor(canvas)
  let low = 0,
    high = 1
  for (let step = 0; step < 12; step++) {
    const amount = (low + high) / 2
    const candidate = mixColors(background, target, amount)
    if (contrastRatio(relativeLuminance(candidate), canvasLuminance) >= minimumBorderContrast)
      high = amount
    else low = amount
  }
  return mixColors(background, target, high)
}

export function venuePalette(color: string, canvas: string) {
  const backgroundHex = normalizeVenueColor(color)
  const canvasHex = normalizeVenueColor(canvas)
  if (!backgroundHex || !canvasHex)
    throw new TypeError('A venue palette requires valid opaque hex colors.')
  const background = parseHex(backgroundHex)
  const surface = parseHex(canvasHex)
  const foreground = foregroundFor(background)
  return {
    background: backgroundHex,
    foreground: toHex(foreground),
    secondary: toHex(foreground),
    border: toHex(boundaryFor(background, surface, foreground)),
    markLine: toHex(mixColors(background, foreground, 0.2)),
  }
}
