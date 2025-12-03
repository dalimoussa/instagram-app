const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Applying local-folder schema fix to "themes" table...');

  // This matches backend/migration.sql and GOOGLE_DRIVE_REMOVAL_COMPLETE.md
  const sql = `
    ALTER TABLE "themes" 
      DROP COLUMN IF EXISTS "drive_folder_id",
      DROP COLUMN IF EXISTS "drive_webview_link",
      ADD COLUMN IF NOT EXISTS "local_folder_path" TEXT NOT NULL DEFAULT '';
  `;

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Schema fix applied successfully.');
  } catch (err) {
    console.error('❌ Failed to apply schema fix:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();


