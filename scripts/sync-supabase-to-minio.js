import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabaseUrl = 'https://usdzlpaletfbvvhkvaki.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZHpscGFsZXRmYnZ2aGt2YWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQxNzUzNiwiZXhwIjoyMDkwOTkzNTM2fQ.t3-rSm4VMT9klY_zFv3_5DLo2no9rP_cUbfmTozdev8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MINIO_BUCKET = 'uploads';

const s3Client = new S3Client({
  endpoint: 'https://minio.packzinhu.online',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'packzinhu',
    secretAccessKey: 'Slimsli89x*',
  },
  forcePathStyle: true,
});

async function syncBuckets() {
  console.log('Iniciando sincronização de arquivos do Supabase (media) para Minio (uploads)...');

  const folders = [
    'chat_media',
    'covers',
    'posts',
    'profiles',
    'secret_contents',
    'services',
    '' // root
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const folder of folders) {
    const { data: files, error: listError } = await supabase.storage.from('media').list(folder, { limit: 1000 });

    if (listError) {
      console.error(`Erro ao listar ${folder}:`, listError.message);
      continue;
    }

    if (!files || files.length === 0) continue;

    console.log(`Encontrados ${files.length} arquivos na pasta ${folder || 'root'}.`);

    for (const file of files) {
      if (!file.name || file.name.startsWith('.emptyFolder') || !file.id) continue;

      const fullPath = folder ? `${folder}/${file.name}` : file.name;
      console.log(`Puxando: ${fullPath}...`);
      
      const { data: fileData, error: downloadError } = await supabase.storage.from('media').download(fullPath);

      if (downloadError) {
        console.error(`Falha no download de ${fullPath}:`, downloadError.message);
        errorCount++;
        continue;
      }

      try {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const command = new PutObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: fullPath,
          Body: buffer,
          ContentType: fileData.type || 'application/octet-stream',
        });
        await s3Client.send(command);
        console.log(`Upload para MinIO OK: ${fullPath}`);
        successCount++;
      } catch (uploadError) {
        console.error(`Falha no upload para MinIO de ${fullPath}:`, uploadError);
        errorCount++;
      }
    }
  }

  console.log(`\nSincronização concluída!`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${errorCount}`);
  console.log(`\nPróximo passo: Rodar o script scripts/update-firebase-urls.js`);
}

syncBuckets().catch(console.error);
