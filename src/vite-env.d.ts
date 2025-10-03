/// <reference types="vite/client" />

// If you want to extend with your own custom vars:
interface ImportMetaEnv {
  readonly VITE_DEBUG_LOGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
