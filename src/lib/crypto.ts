import CryptoJS from 'crypto-js';

/**
 * 简单的对称加密工具
 * 使用 AES 加密算法
 */
export class SimpleCrypto {
  /**
   * 加密数据
   * @param data 要加密的数据
   * @param password 加密密码
   * @returns 加密后的字符串
   */
  static encrypt(data: string, password: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, password).toString();
      return encrypted;
    } catch (error) {
      throw new Error('加密失败');
    }
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据
   * @param password 解密密码
   * @returns 解密后的字符串
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error('解密失败，请检查密码是否正确');
      }

      return decrypted;
    } catch (error) {
      throw new Error('解密失败，请检查密码是否正确');
    }
  }

  /**
   * 验证密码是否能正确解密数据
   * @param encryptedData 加密的数据
   * @param password 密码
   * @returns 是否能正确解密
   */
  static canDecrypt(encryptedData: string, password: string): boolean {
    try {
      const decrypted = this.decrypt(encryptedData, password);
      return decrypted.length > 0;
    } catch {
      return false;
    }
  }
}

// 使用 PBKDF2 和 salt 来增强密码安全性
export async function hashPassword(password: string): Promise<string> {
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false; // or throw an error
  }
  const hashToVerify = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
  return hash === hashToVerify;
}
