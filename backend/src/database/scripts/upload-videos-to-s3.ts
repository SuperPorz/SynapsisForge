/* eslint-disable */
/**
 * upload-videos-to-s3.ts
 * ----------------------
 * Downloads open-source test videos, uploads them to S3, configures CORS,
 * and updates MongoDB lesson_content records with real S3 keys.
 *
 * Usage:
 *   npm run db:upload-videos
 *
 * Prerequisites:
 *   - Docker containers running (MongoDB)
 *   - AWS credentials in .env (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *   - S3 buckets already created (synapsisforge-media, synapsisforge-private)
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import https from 'https';
import { getMongoUri } from '../shared/mongo-uri.util';

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
const MONGO_URI = getMongoUri();

// ── Test video URLs (same pool used by mongo.seed.ts) ─────────────────────────

const TEST_VIDEOS = [
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', size: '1MB' },
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4', size: '2MB' },
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4', size: '5MB' },
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_10MB.mp4', size: '10MB' },
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', size: '1MB' },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', size: '1MB' },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4', size: '2MB' },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4', size: '5MB' },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4', size: '1MB' },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4', size: '2MB' },
];

/**
 * Derives a clean S3 key from a video URL.
 * Example:
 *   https://.../Big_Buck_Bunny_720_10s_1MB.mp4 → videos/bigbuckbunny_720_10s_1MB.mp4
 */
function urlToS3Key(videoUrl: string): string {
  const filename = videoUrl.substring(videoUrl.lastIndexOf('/') + 1);
  const clean = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `videos/${clean}`;
}

/**
 * Returns a mapping: videoUrl → s3Key
 */
function buildKeyMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const v of TEST_VIDEOS) {
    map.set(v.url, urlToS3Key(v.url));
  }
  return map;
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

// ── S3 operations ────────────────────────────────────────────────────────────

async function configureCors(s3: S3Client, bucket: string): Promise<void> {
  console.log(`\n🔧 Configuring CORS on s3://${bucket} ...`);

  const corsConfig = {
    CORSRules: [
      {
        AllowedOrigins: [
          'http://localhost:4200',
          'http://localhost:3000',
          'http://127.0.0.1:4200',
        ],
        AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  try {
    await s3.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsConfig,
    }));
    console.log('  ✅ CORS configured');
  } catch (err: any) {
    if (err.name === 'NoSuchBucket') {
      console.error(`  ❌ Bucket "${bucket}" does not exist. Create it in AWS Console first.`);
      throw err;
    }
    if (err.name === 'AccessDenied') {
      console.error('  ⚠️  Access denied setting CORS. The IAM user may need s3:PutBucketCORS permission.');
      console.error('     Continuing without CORS — you may need to set it manually in AWS Console.');
      return;
    }
    throw err;
  }
}

async function uploadVideoToS3(
  s3: S3Client,
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

// ── MongoDB operations ────────────────────────────────────────────────────────

async function updateMongoRecords(keyMap: Map<string, string>): Promise<number> {
  console.log('\n🍃 Updating MongoDB lesson_content records...');

  await mongoose.connect(MONGO_URI);
  const LessonContent = mongoose.model('LessonContent',
    new mongoose.Schema({}, { strict: false, collection: 'lesson_contents' }),
  );

  let updated = 0;

  for (const [videoUrl, s3Key] of keyMap) {
    const result = await LessonContent.updateMany(
      { videoUrl },
      { $set: { s3Key } },
    );
    updated += result.modifiedCount;
    console.log(`  📺 ${s3Key} → ${result.modifiedCount} lesson(s)`);
  }

  await mongoose.disconnect();
  return updated;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 SynapsisForge — Upload test videos to S3\n');

  // ── 1. Build key mapping ────────────────────────────────────────────────
  const keyMap = buildKeyMap();
  console.log(`📋 Video key mapping (${keyMap.size} unique videos):`);
  for (const [url, key] of keyMap) {
    const name = url.substring(url.lastIndexOf('/') + 1);
    console.log(`  ${name.padEnd(45)} → ${key}`);
  }

  // ── 2. Init S3 ──────────────────────────────────────────────────────────
  const s3 = new S3Client({
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });
  console.log(`\n📦 S3 client initialized (region: ${REGION}, bucket: ${MEDIA_BUCKET})`);

  // ── 3. Configure CORS ───────────────────────────────────────────────────
  await configureCors(s3, MEDIA_BUCKET);

  // ── 4. Download & upload each video ─────────────────────────────────────
  console.log('\n⬇️  Downloading and uploading videos...\n');

  for (const video of TEST_VIDEOS) {
    const key = keyMap.get(video.url)!;
    const name = video.url.substring(video.url.lastIndexOf('/') + 1);

    process.stdout.write(`  📥 ${name} (${video.size})... `);

    try {
      const buffer = await downloadUrl(video.url);
      process.stdout.write(`downloaded (${(buffer.length / 1024 / 1024).toFixed(1)}MB), uploading... `);

      const contentType = video.url.endsWith('.mp4') ? 'video/mp4' : 'video/mp4';
      await uploadVideoToS3(s3, MEDIA_BUCKET, key, buffer, contentType);

      console.log('✅');
    } catch (err: any) {
      console.log(`❌ FAILED — ${err.message}`);
    }
  }

  // ── 5. Update MongoDB ───────────────────────────────────────────────────
  console.log('\n📝 Updating MongoDB lesson records...');
  const count = await updateMongoRecords(keyMap);
  console.log(`  ✅ Updated ${count} lesson_content records`);

  // ── 6. Done ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉 Upload complete!\n');
  console.log('  Next steps:');
  console.log('  1. Set USE_S3=true in backend/.env');
  console.log('  2. Restart the backend server (nest start --watch)');
  console.log('  3. Existing lessons will now use presigned GET URLs from S3\n');
}

main().catch((err) => {
  console.error('\n❌ Script failed:', (err as Error).message);
  process.exit(1);
});
