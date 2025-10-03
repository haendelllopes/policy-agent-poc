declare module 'sql.js' {
  interface Database {
    exec(sql: string): any[];
    prepare(sql: string): any;
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<SqlJsStatic>;

  export = initSqlJs;
}
