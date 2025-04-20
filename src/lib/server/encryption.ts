/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { decodeBase64 } from "@oslojs/encoding";
import { createCipheriv, createDecipheriv } from "crypto";
import { DynamicBuffer } from "@oslojs/binary";

const algoritm = "aes-128-gcm";
const key = decodeBase64(process.env.ENCRYPTION_KEY ?? "");

export function encrypt(data: Uint8Array): Uint8Array {
  const iv = crypto.getRandomValues(new Uint8Array(16));
	const cipher = createCipheriv(algoritm, key, iv);
	const encrypted = new DynamicBuffer(0);
	encrypted.write(iv);
	encrypted.write(cipher.update(data));
	encrypted.write(cipher.final());
	encrypted.write(cipher.getAuthTag());
	return encrypted.bytes();
}

export function encryptString(data: string): Uint8Array {
	return encrypt(new TextEncoder().encode(data));
}

export function decrypt(encrypted: Uint8Array): Uint8Array {
	if (encrypted.byteLength < 33) {
		throw new Error("Invalid data");
	}
  const iv = encrypted.slice(0, 16);
  const authTag = encrypted.slice(encrypted.byteLength - 16);
  const data = encrypted.slice(16, encrypted.byteLength - 16);
	const decipher = createDecipheriv(algoritm, key, iv);
	decipher.setAuthTag(authTag);
	const decrypted = new DynamicBuffer(0);
	decrypted.write(decipher.update(data));
	decrypted.write(decipher.final());
	return decrypted.bytes();
}

export function decryptToString(data: Uint8Array): string {
	return new TextDecoder().decode(decrypt(data));
}
