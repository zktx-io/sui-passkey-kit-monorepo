// https://github.com/MystenLabs/ts-sdks/blob/main/packages/typescript/src/keypairs/passkey/keypair.ts

import {
  BrowserPasswordProviderOptions,
  PasskeyProvider as Provider,
} from '@mysten/sui/keypairs/passkey';
import { fromBase64 } from '@mysten/sui/utils';
import { randomBytes } from '@noble/hashes/utils';

import { getCredential } from './localStorage';

interface AuthenticationCredential extends PublicKeyCredential {
  response: AuthenticatorAssertionResponse;
}
interface RegistrationCredential extends PublicKeyCredential {
  response: AuthenticatorAttestationResponse;
}

export class PasskeyProvider implements Provider {
  #name: string;
  #options: BrowserPasswordProviderOptions;

  constructor(name: string, options: BrowserPasswordProviderOptions) {
    this.#name = name;
    this.#options = options;
  }

  async create(): Promise<RegistrationCredential> {
    return (await navigator.credentials.create({
      publicKey: {
        timeout: this.#options.timeout ?? 60000,
        ...this.#options,
        rp: {
          name: this.#name,
          ...this.#options.rp,
        },
        user: {
          name: this.#name,
          displayName: this.#name,
          ...this.#options.user,
          id: randomBytes(10),
        },
        challenge: new TextEncoder().encode('Create passkey wallet on Sui'),
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          residentKey: 'required',
          requireResidentKey: true,
          userVerification: 'preferred',
          ...this.#options.authenticatorSelection,
        },
      },
    })) as RegistrationCredential;
  }

  async get(challenge: Uint8Array): Promise<AuthenticationCredential> {
    const stored = getCredential();
    if (stored) {
      return (await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification:
            this.#options.authenticatorSelection?.userVerification ||
            'required',
          timeout: this.#options.timeout ?? 60000,
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
