export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = { light: 10, medium: 25, heavy: 50 }
    navigator.vibrate(duration[style])
  }
}
