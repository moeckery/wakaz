// Uncontracted six-dot a–z: https://www.brailleauthority.org/sites/default/files/2023-09/alphabet.pdf
const alphabet = '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'

export function toBraille(code: string): string {
  if (!/^[A-Za-z]+$/.test(code)) {
    throw new TypeError('Matching codes must contain letters A–Z only.')
  }
  return [...code.toLowerCase()].map((letter) => alphabet[letter.charCodeAt(0) - 97]).join('')
}
