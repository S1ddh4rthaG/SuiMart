declare module '*.svg' {
  const content: any;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_TUSKY_API_KEY: string;
  // add other env vars here
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}