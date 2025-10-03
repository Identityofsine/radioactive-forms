export { };

declare global {
  interface Array<T> {
    /**
     * @name collect
     * @description Collects items from the array that satisfies the predicate function.
     *
     * @param fn A predicate function that takes an item and its index, and returns a boolean.
     */
    collect(fn: (item: T, index: number) => boolean): T[];
  }
}


Array.prototype.collect = function(fn) {
  const result: unknown[] = [];
  for (let i = 0; i < this.length; i++) {
    if (fn(this[i], i)) {
      result.push(this[i]);
    }
  }
  return result;
}

