import { createClient } from '@supabase/supabase-js';
import { s3Client } from '../src/lib/s3.js';
import { ensureBucketAndPolicy } from '../src/lib/minio-client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const supabaseUrl = 'https://usdzlpaletfbvvhkvaki.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZHpscGFsZXRmYnZ2aGt2YWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQxNzUzNiwiZXhwIjoyMDkwOTkzNTM2fQ.t3-rSm4VMT9klY_zFv3_5DLo2no9rP_cUbfmTozdev8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';

async function syncBuckets() {
  console.log('Iniciando sincronização de arquivos do Supabase para MinIO...');
  
  try {
    await ensureBucketAndPolicy(MINIO_BUCKET);
  } catch (e) {
    console.error('Erro ao verificar MinIO:', e);
    return;
  }

  const { data: files, error: listError } = await supabase.storage.from('media').list();

  if (listError) {
    console.error('ERRO SUPABASE: A conta do Supabase bloqueou o acesso.', listError.message);
    console.error('Atualmente o Supabase retorna: exceed_cached_egress_quota (402 Payment Required).');
    console.error('Por favor, resolva o pagamento no painel do Supabase, e depois rode este script de novo com: npx tsx scripts/sync-supabase-to-minio.js');
    return;
  }

  if (!files || files.length === 0) {
    console.log('Nenhum arquivo encontrado no bucket media do Supabase.');
    return;
  }

  console.log(`Encontrados ${files.length} arquivos. Fazendo download e upload...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (!file.name || file.name.startsWith('.emptyFolder')) continue;

    console.log(`Puxando: ${file.name}...`);
    const { data: fileData, error: downloadError } = await supabase.storage.from('media').download(file.name);

    if (downloadError) {
      console.error(`Falha no download de ${file.name}:`, downloadError.message);
      errorCount++;
      continue;
    }

    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const command = new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: file.name,
        Body: buffer,
        ContentType: fileData.type || 'application/octet-stream',
      });
      await s3Client.send(command);
      console.log(`Upload para MinIO OK: ${file.name}`);
      successCount++;
    } catch (uploadError) {
      console.error(`Falha no upload para MinIO de ${file.name}:`, uploadError);
      errorCount++;
    }
  }

  console.log(`\nSincronização concluída!`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${errorCount}`);
  console.log(`\nPróximo passo: Rodar o script scripts/update-firebase-urls.js para atualizar as URLs no banco de dados.`);
}

syncBuckets().catch(console.error);
