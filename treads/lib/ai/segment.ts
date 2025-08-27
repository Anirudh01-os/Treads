export type Segmentation = {
  maskUrl?: string;
  categories?: Array<{ name: string; score: number }>
}

export async function segmentClothing(inputUrl: string): Promise<Segmentation>{
  // Placeholder segmentation
  return { maskUrl: undefined, categories: [] };
}

