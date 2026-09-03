import express from 'express';
import cors from 'cors';

// Handlers from api-handlers
import packzinhuHandler from '../api-handlers/packzinhu-db.js';
import minioHandler from '../api-handlers/minio-db.js';
import uploadHandler from '../api-handlers/upload.js';
import presignedHandler from '../api-handlers/presigned-url.js';
import backupHandler from '../api-handlers/backup.js';
import toggleFollowHandler from '../api-handlers/toggle-follow.js';
import notifyFollowHandler from '../api-handlers/notify-follow.js';
import mpPreferenceHandler from '../api-handlers/create-mercadopago-preference.js';
import webhookHandler from '../api-handlers/webhook.js';
import rescueBalanceHandler from '../api-handlers/account/rescue-balance.js';

const app = express();

// Standard CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers with high limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', serverless: true });
});

// Packzinhu DB
router.all('/packzinhu-db', (req, res) => packzinhuHandler(req, res));

// MinIO DB (including legacy save/load/delete endpoints)
router.all(['/minio-db', '/minio-db/save', '/minio-db/load', '/minio-db/delete'], (req, res) => minioHandler(req, res));

// Uploads
router.all(['/upload', '/packzinhu-db-upload'], (req, res) => uploadHandler(req, res));
router.all('/presigned-url', (req, res) => presignedHandler(req, res));

// Backups
router.all(['/backup', '/packzinhu-db/backup'], (req, res) => backupHandler(req, res));

// Follows
router.all('/toggle-follow', (req, res) => toggleFollowHandler(req, res));
router.all('/notify-follow', (req, res) => notifyFollowHandler(req, res));

// Mercado Pago Preferences & Webhook
router.all('/create-mercadopago-preference', (req, res) => mpPreferenceHandler(req, res));
router.all(['/webhook', '/mercadopago-webhook'], (req, res) => webhookHandler(req, res));

// Rescue Balance & Payout
router.all(['/account/rescue-balance', '/rescue-balance'], (req, res) => rescueBalanceHandler(req, res));
router.all('/admin/payout/confirm', (req, res) => {
  req.query.action = 'confirm';
  return rescueBalanceHandler(req, res);
});

// Dual mounting so /api/foo and /foo both resolve cleanly
app.use('/api', router);
app.use('/', router);

// Export for Vercel Serverless Function
export default app;
