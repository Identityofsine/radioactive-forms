export {};

declare global {

  interface Console {
    dLog(...data: Parameters<typeof console.log>): void;
    dInfo(...data: Parameters<typeof console.info>): void;
    dWarn(...data: Parameters<typeof console.warn>): void;
    dError(...data: Parameters<typeof console.error>): void;
  }

}

console.dLog = function(...data: Parameters<typeof console.log>): void {
  if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.log(...data);
  }
}
console.dInfo = function(...data: Parameters<typeof console.info>): void {
  if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.info(...data);
  }
}
console.dWarn = function(...data: Parameters<typeof console.warn>): void {
  if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.warn(...data);
  }
}
console.dError = function(...data: Parameters<typeof console.error>): void {
  if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.error(...data);
  }
}

