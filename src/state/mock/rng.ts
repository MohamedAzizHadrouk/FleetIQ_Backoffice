/** Aléatoire déterministe (graine fixe) du jeu fictif – extrait de generate.ts sans changement (carte FleetIQ 10). */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private r: () => number;
  constructor(seed: number) {
    this.r = mulberry32(seed);
  }
  next(): number {
    return this.r();
  }
  /** entier dans [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.r() * (max - min + 1)) + min;
  }
  float(min: number, max: number): number {
    return this.r() * (max - min) + min;
  }
  chance(p: number): boolean {
    return this.r() < p;
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.r() * list.length)];
  }
  weighted<T>(items: ReadonlyArray<readonly [T, number]>): T {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let x = this.r() * total;
    for (const [item, w] of items) {
      x -= w;
      if (x <= 0) return item;
    }
    return items[items.length - 1][0];
  }
}
