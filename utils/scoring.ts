
import { Signal } from '../types';

// Semantic scoring helpers
export function stem(word: string): string {
  return word.toLowerCase().replace(/s$/, '').replace(/ing$/, '').replace(/ed$/, '');
}

export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array(an + 1).fill(null).map(() => Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[an][bn];
}

export function findMatch(text: string, keywords: string[]): { signal: Signal; score: number } {
  const lowerText = text.toLowerCase();
  
  // 1. Exact Match
  for (const kw of keywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      return { signal: 'Exact', score: 100 };
    }
  }

  // 2. Stem Match
  const wordsInText = lowerText.split(/\s+/).map(stem);
  for (const kw of keywords) {
    const stemmedKw = stem(kw);
    if (wordsInText.includes(stemmedKw)) {
      return { signal: 'Stem', score: 90 };
    }
  }

  // 3. Fuzzy Match
  const textWords = lowerText.split(/\s+/);
  for (const kw of keywords) {
    if (kw.includes(' ')) continue;
    for (const word of textWords) {
      if (levenshteinDistance(word, kw) <= 2) {
        return { signal: 'Fuzzy', score: 75 };
      }
    }
  }

  // 4. Semantic (partial keyword presence)
  let partialMatches = 0;
  for (const kw of keywords) {
    const kwWords = kw.toLowerCase().split(/\s+/);
    for (const kwWord of kwWords) {
      if (wordsInText.some(w => w.includes(kwWord) || kwWord.includes(w))) {
        partialMatches++;
        break;
      }
    }
  }
  if (partialMatches > 0) {
    const score = Math.min(70, (partialMatches / keywords.length) * 100);
    return { signal: 'Semantic', score };
  }

  return { signal: 'None', score: 0 };
}
