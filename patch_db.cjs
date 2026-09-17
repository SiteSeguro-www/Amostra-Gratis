const fs = require('fs');

let dbFile = fs.readFileSync('src/lib/db.ts', 'utf8');

const replacement = `
import path from 'path';

let db: any = null;

if (!process.env.VERCEL) {
  try {
    const Database = (await import('better-sqlite3')).default;
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    db = new Database(dbPath);
    // Initialize tables
    db.exec(\`
      CREATE TABLE IF NOT EXISTS media_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT,
        folder TEXT NOT NULL,
        url TEXT NOT NULL,
        direct_url TEXT,
        mime_type TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_media_user ON media_uploads(user_id);
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        content TEXT,
        media_url TEXT,
        media_type TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TEXT,
        data JSON
      );
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at TEXT,
        PRIMARY KEY (follower_id, following_id)
      );
    \`);
  } catch (e) {
    console.log('Failed to load better-sqlite3', e);
  }
}
`;

dbFile = dbFile.replace(/import Database from 'better-sqlite3';\s*import path from 'path';\s*const dbPath = path\.join\(process\.cwd\(\), 'database\.sqlite'\);\s*const db = new Database\(dbPath\);\s*\/\/ Initialize tables\s*db\.exec\(`[\s\S]*?`\);/, replacement);

// Replace all usages with db?.prepare(...) to avoid crashing if db is null
dbFile = dbFile.replace(/db\.prepare/g, "db?.prepare");
dbFile = dbFile.replace(/return stmt\.run/g, "return stmt?.run");
dbFile = dbFile.replace(/return stmt\.all/g, "return stmt?.all");

fs.writeFileSync('src/lib/db.ts', dbFile);
console.log('Patched db.ts');
