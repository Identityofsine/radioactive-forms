import { afterEach, beforeAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

beforeAll(() => {
  // Silence debug console methods to reduce test output noise
  (console as any).dInfo = () => {};
  (console as any).dLog = () => {};
  (console as any).dWarn = () => {};
  (console as any).dError = () => {};

  Array.prototype.collect = function (fn) {
    const result: unknown[] = [];
    for (let i = 0; i < this.length; i++) {
      if (fn(this[i], i)) {
        result.push(this[i]);
      }
    }
    return result;
  };
});

afterEach(() => {
  cleanup();
});
