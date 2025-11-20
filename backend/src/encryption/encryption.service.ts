import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm: string;
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    this.algorithm = this.configService.get('ENCRYPTION_ALGORITHM') || 'aes-256-gcm';
    const keyString = this.configService.get('ENCRYPTION_KEY');
    
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }
    
    // Ensure key is 32 bytes for AES-256
    this.key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32));
  }

  /**
   * Encrypt sensitive data (e.g., Instagram access tokens)
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = (cipher as any).getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    (decipher as any).setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate SHA-256 hash for duplicate detection
   */
  hash(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
