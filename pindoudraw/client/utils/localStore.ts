export interface StoredResult {
  id: string;
  width: number;
  height: number;
  totalBeads: number;
  colorCount: number;
  legend: Array<{
    id: string;
    hex: string;
    name: string;
    brand: string;
    count: number;
    percentage: number;
    number: string;
    stdNum: string;
  }>;
  brand: string;
  pixels: number[][];
  colorMap: Record<string, { r: number; g: number; b: number; hex: string; name: string }>;
  originalWidth: number;
  originalHeight: number;
}

const store = new Map<string, StoredResult>();

export function saveResult(r: StoredResult): void { store.set(r.id, r); }
export function getResult(id: string): StoredResult | undefined { return store.get(id); }
export function removeResult(id: string): void { store.delete(id); }
