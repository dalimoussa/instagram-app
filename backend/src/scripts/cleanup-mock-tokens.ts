import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Simple encryption service for the cleanup script
 */
class SimpleEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }
    this.key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32));
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

/**
 * Cleanup script to detect and deactivate Instagram accounts with mock tokens
 * Run this after upgrading from old code that used mock refresh tokens
 */
async function cleanupMockTokens() {
  const prisma = new PrismaClient();
  const encryption = new SimpleEncryption();

  try {
    console.log('🔍 Scanning for Instagram accounts with mock tokens...\n');

    const accounts = await prisma.igAccount.findMany({
      where: { isActive: true },
    });

    let foundMockTokens = 0;
    let deactivatedAccounts = 0;

    for (const account of accounts) {
      try {
        // Try to decrypt the token
        let decryptedToken: string;
        try {
          decryptedToken = encryption.decrypt(account.accessToken);
        } catch {
          // Token not encrypted, use as-is
          decryptedToken = account.accessToken;
        }

        // Check if it's a mock token
        const isMockToken = decryptedToken.startsWith('refreshed_') || decryptedToken.length < 50;

        if (isMockToken) {
          foundMockTokens++;
          console.log(`❌ Mock token found for account: ${account.username} (${account.igUserId})`);
          console.log(`   Token: ${decryptedToken.substring(0, 30)}...`);

          // Deactivate the account
          await prisma.igAccount.update({
            where: { id: account.id },
            data: { isActive: false },
          });
          deactivatedAccounts++;
          console.log(`   ✅ Account deactivated\n`);
        } else {
          console.log(`✅ Valid token for account: ${account.username}`);
        }
      } catch (error) {
        console.error(`⚠️  Error processing account ${account.username}:`, error.message);
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total accounts scanned: ${accounts.length}`);
    console.log(`   Mock tokens found: ${foundMockTokens}`);
    console.log(`   Accounts deactivated: ${deactivatedAccounts}`);
    console.log(`   Valid accounts: ${accounts.length - foundMockTokens}\n`);

    if (deactivatedAccounts > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   Deactivated accounts need to be reconnected via the UI.');
      console.log('   Go to IG Accounts page → Delete old account → Connect new account\n');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupMockTokens()
  .then(() => {
    console.log('✅ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
