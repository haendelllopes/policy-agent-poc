// Global type declarations for Node.js modules
declare global {
  var process: {
    env: { [key: string]: string | undefined };
    cwd(): string;
  };
  var Buffer: {
    from(data: Uint8Array): Buffer;
  };
  var require: (id: string) => any;
  var console: {
    log(...args: any[]): void;
  };
}

declare module 'fs' {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readFileSync(path: string): Buffer;
  export function writeFileSync(path: string, data: Buffer): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
}

export {};
