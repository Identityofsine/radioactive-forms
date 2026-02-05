export { };

declare global {
  interface Console {
    dLog(...data: Parameters<typeof console.log>): void;
    dInfo(...data: Parameters<typeof console.info>): void;
    dWarn(...data: Parameters<typeof console.warn>): void;
    dError(...data: Parameters<typeof console.error>): void;
  }
}

const debugEnabled =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_DEBUG_LOGS === 'true') ||
  (typeof process !== 'undefined' &&
    process.env?.DEBUG_LOGS === 'true');

console.dLog = (...data) => {
  if (debugEnabled) console.log(...data);
};

console.dInfo = (...data) => {
  if (debugEnabled) console.info(...data);
};

console.dWarn = (...data) => {
  if (debugEnabled) console.warn(...data);
};

console.dError = (...data) => {
  if (debugEnabled) console.error(...data);
};

