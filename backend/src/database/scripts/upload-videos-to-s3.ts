/* eslint-disable */
/**
 * upload-videos-to-s3.ts
 * ----------------------
 * Downloads the single test video and uploads it to S3.
 * Now also called automatically by reset.sh after every 3-hour reset.
 *
 * Usage (manual):
 *   npm run db:upload-videos
 *
 * Prerequisites:
 *   - AWS credentials in .env (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *   - S3 bucket already created (synapsisforge-media)
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';

// ── Config ───────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} not set in .env`);
  return value;
}

const REGION = requireEnv('AWS_REGION');
const ACCESS_KEY = requireEnv('AWS_ACCESS_KEY_ID');
const SECRET_KEY = requireEnv('AWS_SECRET_ACCESS_KEY');
const MEDIA_BUCKET = process.env.S3_MEDIA_BUCKET ?? 'synapsisforge-media';

// ── Singolo video di test (stessa URL usata da mongo.seed.ts) ─────────────────

const TEST_VIDEO = {
  url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  size: '1MB',
};

/**
 * Deriva la s3Key dalla URL (stessa logica di mongo.seed.ts).
 *   Big_Buck_Bunny_720_10s_1MB.mp4 → videos/big_buck_bunny_720_10s_1mb.mp4
 */
function urlToS3Key(videoUrl: string): string {
  const filename = videoUrl.substring(videoUrl.lastIndexOf('/') + 1);
  const clean = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `videos/${clean}`;
}

// ── HTTP download helper ─────────────────────────────────────────────────────

function downloadUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 SynapsisForge — Upload test video to S3\n');

  const s3Key = urlToS3Key(TEST_VIDEO.url);
  const name = TEST_VIDEO.url.substring(TEST_VIDEO.url.lastIndexOf('/') + 1);

  console.log(`  Video: ${name} (${TEST_VIDEO.size})`);
  console.log(`  S3:    s3://${MEDIA_BUCKET}/${s3Key}\n`);

  const s3 = new S3Client({
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  process.stdout.write('⬇️  Downloading... ');
  const buffer = await downloadUrl(TEST_VIDEO.url);
  console.log(`done (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

  process.stdout.write('⬆️  Uploading to S3... ');
  await s3.send(new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'video/mp4',
  }));
  console.log('✅');

  console.log('\n' + '─'.repeat(55));
  console.log('🎉 Done — single test video uploaded to S3\n');
}

main().catch((err) => {
  console.error('\n❌ Script failed:', (err as Error).message);
  process.exit(1);
});
