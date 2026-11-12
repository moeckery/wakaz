export function useDemoPreferences() {
  const dark = useState('demo-dark', () => false)
  const arabicTextBy = useState<'word' | 'character'>('demo-arabic-text-by', () => 'word')
  const liveCamera = useState('demo-camera', () => false)
  return { dark, arabicTextBy, liveCamera }
}
