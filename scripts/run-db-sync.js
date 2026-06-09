import { spawn } from 'child_process';
import fs from 'fs';

console.log('Starting background DB sync...');

const out = fs.openSync('sync-db.log', 'a');
const err = fs.openSync('sync-db-err.log', 'a');

const child = spawn('npx', ['tsx', 'scripts/sync-supabase-db.js'], {
  detached: true,
  stdio: [ 'ignore', out, err ]
});

child.unref();

console.log('DB Sync process detached and running in background with PID ' + child.pid);
process.exit(0);
