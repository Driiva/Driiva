import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export class CryptoService {
  private deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
  }

  encrypt(text: string, password: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  }

  decrypt(encryptedData: string, password: string): string {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = this.deriveKey(password, salt);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  hashData(data: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const hash = pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha256');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  verifyHash(data: string, hashedData: string): boolean {
    const [saltHex, hashHex] = hashedData.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    
    const computedHash = pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha256');
    return computedHash.equals(hash);
  }
}

export const crypto = new CryptoService();
