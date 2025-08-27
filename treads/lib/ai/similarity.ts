export async function embedImage(_url: string): Promise<number[]>{
  // Placeholder CLIP-like vector
  return Array.from({ length: 16 }, (_, i) => Math.sin(i));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
  const na = Math.hypot(...a);
  const nb = Math.hypot(...b);
  return na && nb ? dot / (na * nb) : 0;
}

