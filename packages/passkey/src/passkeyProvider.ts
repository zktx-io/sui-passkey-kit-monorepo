// https://github.com/MystenLabs/ts-sdks/blob/main/packages/typescript/src/keypairs/passkey/keypair.ts

import { PasskeyProvider as Provider } from '@mysten/sui/keypairs/passkey';
import { fromBase64, toBase58 } from '@mysten/sui/utils';
import { randomBytes } from '@noble/hashes/utils';

import { getCredential } from './localStorage';

interface AuthenticationCredential extends PublicKeyCredential {
  response: AuthenticatorAssertionResponse;
}
interface RegistrationCredential extends PublicKeyCredential {
  response: AuthenticatorAttestationResponse;
}

export class PasskeyProvider implements Provider {
  #displayName: string;

  constructor(displayName: string) {
    this.#displayName = displayName;
  }

  async create(): Promise<RegistrationCredential> {
    throw new Error('Method not implemented.');
  }

  async create2(): Promise<{
    rp: {
      name: string;
      id: string;
    };
    user: {
      name: string;
      displayName: string;
    };
    credential: RegistrationCredential;
  }> {
    const rp = {
      name: window.location.hostname,
      id: window.location.hostname,
    };
    const user = {
      id: randomBytes(16),
      name: toBase58(randomBytes(4)),
      displayName: this.#displayName,
    };
    const credential = (await navigator.credentials.create({
      publicKey: {
        timeout: 60000,
        rp,
        user,
        challenge: new TextEncoder().encode('Create passkey wallet on Sui'),
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          residentKey: 'required',
          requireResidentKey: true,
          userVerification: 'required',
        },
      },
    })) as RegistrationCredential;
    return {
      rp,
      user: {
        name: user.name,
        displayName: user.displayName,
      },
      credential,
    };
  }

  async get(challenge: Uint8Array): Promise<AuthenticationCredential> {
    const stored = getCredential();
    if (stored) {
      return (await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: 'required',
          timeout: 60000,
          allowCredentials: [
            {
              type: 'public-key',
              id: fromBase64(
                stored.credentialId
                  .replace(/-/g, '+')
                  .replace(/_/g, '/')
                  .replace(/\s/g, ''),
              ),
            },
          ],
        },
      })) as AuthenticationCredential;
    }
    throw new Error('No credential found');
  }
}
