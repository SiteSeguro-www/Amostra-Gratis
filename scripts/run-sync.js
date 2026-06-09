import { spawn } from 'child_process';
import fs from 'fs';

console.log('Starting background sync...');

const out = fs.openSync('sync.log', 'a');
const err = fs.openSync('sync-err.log', 'a');

const child = spawn('npx', ['tsx', 'scripts/sync-supabase-to-minio.js'], {
  detached: true,
  stdio: [ 'ignore', out, err ]
});

child.unref();

console.log('Sync process detached and running in background with PID ' + child.pid);
process.exit(0);
