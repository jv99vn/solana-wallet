import CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const PBKDF2_ITERATIONS = 100000;
const KEY_SIZE = 256 / 32;

export function generateMnemonic(): string {
  return bip39.generateMnemonic(128);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

export async function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
  return await bip39.mnemonicToSeed(mnemonic);
}

export function deriveKeypair(seed: Buffer, accountIndex: number = 0): Keypair {
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed);
}

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export function generateIV(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  });
}

export function encryptData(data: string, password: string, salt: string, iv: string): string {
  const key = deriveKey(password, salt);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

export function decryptData(encryptedData: string, password: string, salt: string, iv: string): string {
  const key = deriveKey(password, salt);
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function signMessage(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

export function publicKeyToBase58(publicKey: Uint8Array): string {
  return bs58.encode(publicKey);
}

export function base58ToPublicKey(base58: string): Uint8Array {
  return bs58.decode(base58);
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}
