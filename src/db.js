const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.sqlite');

async function openDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const SQL = await initSqlJs({ 
    locateFile: (f) => require.resolve('sql.js/dist/sql-wasm.wasm') 
  });
  let db;
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }
  return { SQL, db };
}

function persistDatabase(SQL, db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT,
      start_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      version TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      section TEXT,
      content TEXT NOT NULL,
      embedding TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_docs_tenant ON documents(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  `);
}

function runQuery(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function runExec(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

module.exports = {
  openDatabase,
  persistDatabase,
  migrate,
  runQuery,
  runExec
};
