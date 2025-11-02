import crypto from 'crypto';

// Encryption key must be provided via environment. Do NOT fallback to a random key.
function getEncryptionKey(): string {
    // Prefer Astro env at build/runtime if available, fallback to Node env
    const fromAstro = (typeof import.meta !== 'undefined' && (import.meta as any).env)
        ? (import.meta as any).env.ENCRYPTION_KEY
        : undefined;
    const fromProcess = process.env.ENCRYPTION_KEY;
    const key = fromAstro || fromProcess;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    return key;
}
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Derive a key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
	return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt a RevenueCat API key
 */
export function encryptApiKey(apiKey: string): string {
	try {
		const salt = crypto.randomBytes(SALT_LENGTH);
        const key = deriveKey(getEncryptionKey(), salt);
		const iv = crypto.randomBytes(IV_LENGTH);
		
		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
		
		let encrypted = cipher.update(apiKey, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		
		const tag = cipher.getAuthTag();
		
		// Combine salt, iv, tag, and encrypted data
		return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
	} catch (error) {
		throw new Error('Failed to encrypt API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
	}
}

/**
 * Decrypt a RevenueCat API key
 */
export function decryptApiKey(encryptedApiKey: string): string {
	try {
		const parts = encryptedApiKey.split(':');
		if (parts.length !== 4) {
			throw new Error('Invalid encrypted API key format');
		}
		
		const salt = Buffer.from(parts[0], 'hex');
		const iv = Buffer.from(parts[1], 'hex');
		const tag = Buffer.from(parts[2], 'hex');
		const encrypted = parts[3];
		
        const key = deriveKey(getEncryptionKey(), salt);
		
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(tag);
		
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		
		return decrypted;
	} catch (error) {
		throw new Error('Failed to decrypt API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
	}
}

