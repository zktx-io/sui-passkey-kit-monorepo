// https://github.com/MystenLabs/ts-sdks/blob/main/packages/typescript/src/keypairs/passkey/publickey.ts

export const PASSKEY_UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;

export const SECP256R1_SPKI_HEADER = new Uint8Array([
  0x30,
  0x59, // SEQUENCE, length 89
  0x30,
  0x13, // SEQUENCE, length 19
  0x06,
  0x07, // OID, length 7
  0x2a,
  0x86,
  0x48,
  0xce,
  0x3d,
  0x02,
  0x01, // OID: 1.2.840.10045.2.1 (ecPublicKey)
  0x06,
  0x08, // OID, length 8
  0x2a,
  0x86,
  0x48,
  0xce,
  0x3d,
  0x03,
  0x01,
  0x07, // OID: 1.2.840.10045.3.1.7 (prime256v1/secp256r1)
  0x03,
  0x42, // BIT STRING, length 66
  0x00, // no unused bits
] as const);

export function parseDerSPKI(derBytes: Uint8Array): Uint8Array {
  // Verify length and header bytes are expected
  if (
    derBytes.length !==
    SECP256R1_SPKI_HEADER.length + PASSKEY_UNCOMPRESSED_PUBLIC_KEY_SIZE
  ) {
    throw new Error('Invalid DER length');
  }
  for (let i = 0; i < SECP256R1_SPKI_HEADER.length; i++) {
    if (derBytes[i] !== SECP256R1_SPKI_HEADER[i]) {
      throw new Error('Invalid spki header');
    }
  }

  if (derBytes[SECP256R1_SPKI_HEADER.length] !== 0x04) {
    throw new Error('Invalid point marker');
  }

  // Returns the last 65 bytes `04 || x || y`
  return derBytes.slice(SECP256R1_SPKI_HEADER.length);
}
