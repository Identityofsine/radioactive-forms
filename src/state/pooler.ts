export type PoolerOptions<T> = {
  delayMs?: number;
  fn: (items: T[]) => void;
  maxItems?: number;
}

export class Pooler<T> {
  private items: T[] = [];
  private timeoutId: number | null = null; 
  private options: PoolerOptions<T>;

  constructor(options = {
    delayMs: 100,
    fn: (items: T[]) => { },
    maxItems: 10,
  }) {
    this.options = options;
  }

  public pool(item: T): void {
    this.items.push(item);
    if (this.items.length >= this.options.maxItems) {
      this.flush();
    }
    else if (this.timeoutId === null) {
      this.timeoutId = window.setTimeout(() => this.flush(), this.options.delayMs);
    } else {
      // already scheduled
      clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => this.flush(), this.options.delayMs);
    }

  }

  private flush(): void {
    this.options.fn(this.items);
    this.items = [];
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

