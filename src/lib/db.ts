import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
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
`);

export default db;

export interface MediaRecord {
  id?: number;
  user_id: string;
  file_name: string;
  original_name?: string;
  folder: string;
  url: string;
  direct_url?: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
}

export function saveMediaUpload(record: MediaRecord) {
  const stmt = db.prepare(`
    INSERT INTO media_uploads (user_id, file_name, original_name, folder, url, direct_url, mime_type, size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    record.user_id,
    record.file_name,
    record.original_name || null,
    record.folder,
    record.url,
    record.direct_url || null,
    record.mime_type || null,
    record.size || 0
  );
}

export function savePostLocal(post: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO posts (id, author_id, content, media_url, media_type, likes_count, comments_count, created_at, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    post.id,
    post.authorId || post.author_id,
    post.content || '',
    post.mediaUrl || post.media_url || null,
    post.mediaType || post.media_type || null,
    post.likesCount || post.likes_count || 0,
    post.commentsCount || post.comments_count || 0,
    post.createdAt || post.created_at,
    JSON.stringify(post)
  );
}

export function saveLikeLocal(like: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO likes (id, post_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(
    like.id || `${like.post_id}_${like.user_id}`,
    like.post_id || like.postId,
    like.user_id || like.userId,
    like.created_at || like.createdAt
  );
}

export function deleteLikeLocal(postId: string, userId: string) {
  const stmt = db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?');
  return stmt.run(postId, userId);
}

export function saveCommentLocal(comment: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO comments (id, post_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(
    comment.id,
    comment.post_id || comment.postId,
    comment.user_id || comment.userId,
    comment.content,
    comment.created_at || comment.createdAt
  );
}

export function saveFollowLocal(followerId: string, followingId: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO follows (follower_id, following_id, created_at)
    VALUES (?, ?, ?)
  `);
  return stmt.run(followerId, followingId, new Date().toISOString());
}

export function deleteFollowLocal(followerId: string, followingId: string) {
  const stmt = db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?');
  return stmt.run(followerId, followingId);
}

export function getMediaByUser(userId: string) {
  const stmt = db.prepare('SELECT * FROM media_uploads WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as MediaRecord[];
}
