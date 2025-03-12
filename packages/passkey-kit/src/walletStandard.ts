import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { PasskeyKeypair } from '@mysten/sui/keypairs/passkey';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, toBase64 } from '@mysten/sui/utils';
import {
  ReadonlyWalletAccount,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsOnMethod,
  SUI_CHAINS,
  SuiFeatures,
  SuiSignAndExecuteTransactionMethod,
  SuiSignPersonalMessageMethod,
  SuiSignTransactionMethod,
  Wallet,
} from '@mysten/wallet-standard';
import { secp256r1 } from '@noble/curves/p256';
import mitt, { Emitter } from 'mitt';

import { getCredential, setCredential } from './localStorage';
import { parseDerSPKI } from './parseDerSPKI';
import { PasskeyProvider } from './passkeyProvider';

type WalletEventsMap = {
  [E in keyof StandardEventsListeners]: Parameters<
    StandardEventsListeners[E]
  >[0];
};

export type NETWORK = 'testnet' | 'devnet';

export class WalletStandard implements Wallet {
  readonly #events: Emitter<WalletEventsMap>;
  #accounts: ReadonlyWalletAccount[] = [];

  #network: NETWORK;
  #passkeyProvider: PasskeyProvider | undefined;
  #signer: PasskeyKeypair | undefined;

  get name() {
    return 'Sui Passkey' as const;
  }

  get icon() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAaGVYSWZNTQAqAAAACAAEAQYAAwAAAAEAAgAAARIAAwAAAAEAAQAAASgAAwAAAAEAAgAAh2kABAAAAAEAAAA+AAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAEsoAMABAAAAAEAAAEsAAAAAFqfB9wAAALkaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjE8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+MjwvdGlmZjpQaG90b21ldHJpY0ludGVycHJldGF0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MzAwPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4zMDA8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4Ky6ycLgAAFh5JREFUeAHtnc+LZcUVx187LkR6O/iDSMh2XDnogDNCkEAWMpKFEIKalQvFnYorYRiEBEE0i4hkIIoLR3DjqhGCyCA4DkxEIeAqi0BW/hUav21q+s7r1+9n1alzTn3upu97796qU59z7rdPnVvvvr29e878OGODAAQgEIDAHQFsxEQIQAAChwQQLAIBAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAAQQLGIAAhAIQwDBCuMqDIUABBAsYgACEAhDAMEK4yoMhQAEECxiAAIQCEMAwQrjKgyFAATuBMHYBJ74zWO3ADx+4dzh/vlzZ2+99+jDD93av/H1t4f7X9385tZ72rl2/ebh608///K293kBgdoE9vbuOfNj7UZpzy+BIlCvvfTCbCpGtSx+6933Dpt69fW3azVJOxC4RQDBuoUi745ESgKlrYVInUROGZmyMWVgZF8nUeL9TQggWJvQCnRsESlLgVqFR9kX4rWKEp8vI4BgLaMT8DOPQjWPUcLFlHGeCq/XIYBgrUMpyDHXDz40nfLtigXh2pXgeOezrCGBz9+89PLsh++/CyVWwv7Ki88d2i372SCwDgEyrHUoOT1GF7ou+iwbGVcWT7Ybx6m9/dOX2zVPy60IZBMrcTr/yNnZ/t13zT774kYrbLQbnAAZVkAHRqtVbYpYyyEuXHx209M4fgAC1LACOVl3ALOLldyhpRiqyWm8bBCYEmBKOKXheF8X78HVK7MH7r/PsZV1TXv6qSeZItZFGr41BCuAC1WveueNSwEsrW8ida36TCO3iGA5917G4vqmyBGtTYnlPR7BcuxbxOrIOYjWEYuR9xAsp95HrI47BtE6zmS0d1jW4NDjpcDu0DQXJl185nme/uDCE/ZGIFj2zFf2qFv6bMsJ3HHvg8sP4NOUBFiH5cytWmfFtpoAnFYzyngEguXIq6pbeXp+lSM0x0wRJ0TrGJb0b1B0d+JiiuybO0KLaPnu4ebcIp9BDcuJ96hbbe8IivDbs4t2JlNCBx5TdsW2PYHyvPrtW+DMKAQQrM6eYiq4uwNUz+KL0rtzjNACghXBS9i4kgBZ1kpEKQ5AsDq6keyqHnyyrHosPbdE0b2jdyi014XPg//q8vTYGhlWJ69QaK8PniyrPlNvLZJhdfII2VUb8GRZbbh6aZUMq4MnuKPVDjpZVju2HlpGsDp44fEL5zr0Ok6X8M3rawSrg2/PnzvboddxuoRvXl9Tw+rgW+pX7aHz+Jn2jHv0QIZlTJ27gzbAqRPacLbuBcGyJk5/JgRY+W6C2bwTpoTGyJkO2gFnWmjH2qonMiwr0j/1wzTFEDa8bWEb9YZgGYFWN9xuN4QNb1vYRr0hWEag6caeAMsb7Jm37hHBak140j4X0AQGuxDYggCCtQU0ToEABPoQQLAMuet7bmwQgMD2BBCs7dlxpnMC/INw7qAtzEOwtoDGKRCAQB8CCJYRd9ZgGYGe6wbuc0CCv0SwgjsQ8yEwEgEEy8jbLBo1Ak03qQkgWEbuvXb9plFPdAOBvAQQrLy+ZWQQSEcAwUrnUgY0JfDp519OX7IfnACCZeRALhwj0HSTmgCCldq9DA4CuQggWIb+1G/msdkRgLcda6ueECwr0vQDAQjsTADB2hkhDUAAAlYEECwr0j/189XNbwx7oyt454sBBMvQpyweNYRNVykJIFgp3cqgRODV198GRDICCJahQ7UWiztXhsDpKh0BBCudSxmQCLz17nuASEgAwTJ26p/+8jfjHukOAnkI8MvPHXzJrz+3h86vPrdn3KMHMqwO1KljtYXOdLAt356tI1gd6DMt7ACdLlMQQLBSuJFBTAmwnGFKI9c+gtXBnyxvaAed6WA7th5aRrA6eYFpYSfwdBuaAILVyX1kWfXBK7tiOlifq6cWWdbQ0Rv6zbyDq1c6WpCra5Yy5PLnotGQYS2iYvQeWVY90NSu6rH03BIZVmfvkGXVcQDZVR2O3lshw+rsIWVZZAe7OQF+u/GLdDYZlhNv8XWd7R1BdrU9u2hnkmE58RhZwnaOgNt23KKedWpv//TlqMZnsvuzL27M9u++a3b+kbOZhtV0LBIrljE0ReyucQTLkUsQrfWdgVitzyrTkdSwHHrz+sGHs0cffsihZT5M0tMuLlx81ocxWGFKAMEyxb1+ZxThT2ZFkf1kNtk/oeju1MMXn3neqWV9zYJLX/69e0ewenvghP5Zn3UcjOpW4sI2LgGK7o59TxH+yDkU2Y9YjLxHDSuA90f/+o6mgWRWAQLVwEQEywByrS5Gu3vI3cBakZOnHQQrmC/fvPTy7JUXnwtm9ebmjiZWyqKn2+MXzk1fzq5dv3n4evRME8G6LSxivMguWpnrVUWYXnvphcNg22W9nUT9q5vfHLYzyop/BCuGRh2zMqtoZRQriVQNgToWBHNviJ22zOKFYM05PdJLiZa2DFNEZQt6zn2WKU8RqV0yqF1isWRf2cQLwdolKpycG1m4EKr2QZQpa0Ww2seLWQ+RpokIlVlY3Ooog3AhWLfcmWfHs3AhVP3jLLJwIVj946eZBZ6mitmESk6Lvi4uonAhWM3kwlfD1uIlgdKWqZBePNq7oF7sqPE3mmghWDW8HrCNFgJWsijhyHK3b961EqtsvyUZSbQQrPmIHPi1LkZt86usz5/7+bHNZZFiWXWtY7MKk8Y2v3muDc7buulr/bOJ8FBEBGtTz3L8kAQyi9XUod6/aM7jZabeYh8CCwiouP773z2x4JN8bz391JOHP4aiRxt53BAsj17BJjcEot8J3AakfrlJv+DkUbR44ug2HuWcIQhoGtjrqzW9AevrXqWm2duWaf8I1pQG+xD4P4FRalbLHK67od5EC8Fa5jE+G5IAYnXk9vKUiaN3+u4hWH3507szAojV7Q7RlFh1PC8bRXcvnsCO7gQ0/XnnjUvd7fBmwAP33+emCI9geYsO7OlG4IO//nmmi5PtOAEvdw6ZEh73De8MSGDkO4LrutvDnUNWuq/rLY5LTeCH779LPb5ag+v9FR4yrFqepJ2wBJRdsa1HQEX4nksdEKz1/MRRSQlwV3Bzx/Zc6oBgbe4vzoDA0AR6ZlnUsIYOvbEH7zW7Kg8/LI/z0eN9vH1FqFctC8Ea+5odevReCu26+PVkVm3Lni+m2pGeVeblZ916PIrmzqEjlsEPS8BLoX2Tp31KzIqgeRAt1bKKPVaBRA3LijT9QGBCQFmVMpRtfuhU59xx74MziV3PrUctiwyrp8fpuxuB3hlKjccRF7HrPRZLJ5JhWdKmLxcEeq4jEoCamZFEqxTpe8C1XuKAYPXwMn12JTD/IxuWxmxSs1rXrlKwX/f4msdZ371EsGp6j7ZCECi/AtTD2DKNq9m3Ct81s7ZNbbPMWBGsTb3D8eEJWGcFBVhLUWkhhMXuVX8tp4UI1ipv8HkqAl6WM7SA2rOW1WI8i9rkLuEiKoO/tyzFt153k8kV0x+gzTSusrzBIjYQrEyRMzeWqfCUQvO0flNrarToP3v5WkkxqVysFkFd+lz0dzr+RZ+3fK/12MW8lk9bctilbQRrF3oOzi2iJEEqF6N10C7qb/69+bVCErkiahKz1hdzcdW8XeX91n8XiXrtPsVxnnPtPnq3h2D19sCa/RdhKgXOXhfemuauPEz2lzFML7KpkKkRSzFbabTzA0oW3cNM9W3xTwfB6uHdFX1mE6cVw73t46mQ6QOJmb6GEn0r4hx9HL3tR7B6e+Cn/qcCRWC3c0jh3K6H5S2r/5ZZSCkJLLeizadWfSNYbfy3tNVy4Wh6h0AtRcWHGxAYIZYQrA0CYpdDJVJZ6k+7cOh5bs8aj8Yt/7fMsHqyteobwWpIuojUCP/5GmJM07TioNW0sPeCWKsYR7AqXw6IVGWgyZprkWV5fdRzC9fxiOQdqUqgtFGP2hHkktNr3SWUrw6uXlnSk81HtZ/Y4OVRz7X8tMwLZFjL6Cz5jExqCRw+WkpASzVqrS/rPRUsA7VYGKu+EKxCfI2/iNQakDhkLQLK9HbNtK4ffDjcXWYEa0V4FZHSYVaFxRUm8XESAmWF/6aPhvEyte3hBmpYJ1AvQoVInQDI8O2atREv9Z55fMq2lk0TFY/avNZKd80W53mc9JoMa0IGkZrAcLQrv2Rfv6Rsq2RcQj+tCfFP8ygYEayfWCBURwHBng8CiNRiPwwrWBKp8kgWgmNxcHh5t+aTAJS54O/6nt20DretBcMJFtnUtqGS4zz9woyHtVg5aNqPYhjBQqjsg6tWj1ZPAqhl72jtqOButaUXLITKKpRi9JO9eB/DC9tbmfZXcyRUWlin9J+axfYB4uHM2v6b3oHzML7oNmg5htWWUrD0dQWEyiqEbPrRP6BaW3mWfK32Rm/HMmtNJVglq5quZxk9mLKMv+azrCwzgiz8TxqHZf1KNqRZ6S6x4u7PSWEV/31N4y5cfLbaQEb8Hl41eJOGan4LYdLsibspMqwyBTxxlHwQnkDtOpaWN7DtRsA6u5K14QVrpIeX7RZe8c+uWceyrLvEJ+9nBKf29k9f9mPOZpYgVpvxin70r375i9n7H31SbRj7d981O//I2WrtjdbQY0/+0XzIYTMsxMo8VtJ1SPF9e5f2mA7K2pBFd8Rq+0CLfubFZ56v+uQGiu/bRYR1sb1YGS7DUh2DZQvFfeP9rbm8QfRq3nkcxRu9sivxDSdYeoAZ27gEWnyvsOcFGM2TYmX1ZIZFbEJNCZkKLnLheO/VnhaKIFPD9eKo11SwWBcmw0Ksisv42yLLZl3W6rjykImGWdbwj4//vpooRwxB4IH775v989t/zf79n/9WG6/aYpnDyTh7TwWLZSEyLGVXbBCYEmiRZak2w5McppR/3heTnnWrqUUhBIu7glOXsS8C+qpOzZXvharuGiJahcbPfz1Nl90LFtnV7cHDqyMCtZc4lJY9XaDFpl5/NRX09DUm93cJvf6OXK8Aot/bCbS6a8XTP2Y7/zL17Z6q88p1htUi5a+DjVa8ENByhBabsgotnxh181Jkn+fvWrBapfzzEHgdl0CrWpaISLQ83Mq39o5XsRIH18saWMpgHaox+6v9FIcphc++uDHUcgfPYiW/uBUsTQeffurJaeywD4GFBLQuS2uoJC4tNrWrdV8SRvWVddMU+N0PPnY9PLdTQqaDruPGnXGtl75oeqglDxmniFrG0eLrTi2CxK1gtRgsbeYm0KoAP6WmBZSZREtjkRB7Wrow5T2/71awWnwrf37wvM5FoGUBfkoqg2iVrMrLCvYp32X7btdhsf5qmdv4bBkBy+lNxC/ley+sL/OtywyL9VfLXMZnqwi0+J7hSX0qQ9Hi1QjTxKhZ1ZS9S8GaGsg+BDYloKmhRT1rapeES5mdR+EqQhWpVjVlO91HsKY02E9DQKJl/T1UFa6nGZeEoucm8VT2l0GoCsc7y46nvyxp8OSNuLaUpQ49CsulT5U3FM/Flrg0fVjucuHob3/9KL8X5yM+wluh3x2s/bC/TaDowYBl4an1QmiNveWC2k041DqWKWEtkrTjlsDB1StNnp3ldsATw5TZWU+NJ91X30WwqiOlQY8EEK0cT+1FsDxeXdjUhIBEK1O2sQmkLJkWgrWJ1zk2PIEsF+42jsgwdgRrG89zTmgCGS7cbR0QfewI1rae57zQBKJfuLvAjzx2BGsXz3NuaAKRL9xdwUcdO4K1q+c5PzQBXbj6ov2IxfiIooVghb7cML4WgYgXb42xRxs3glXD67SRgsCo2VYk0UKwUlxqDKImgUgXcK1xRxkzglXL47STikDJtlINasVgIogWgrXCiXwMgZEIeBctBGukaGSsEFiDgETL61N/Eaw1HMghEBiJgB785/VXdBCskSKRsUJgBQGJVXn44IpDu3yMYHXBTqcQ8EfAu1iJGILlL26wCALmBCKIlaAgWOahQYcQ8EUgiliJGoLlK3awBgKmBCKJlcAgWKbhQWcQ8EMgmliJHILlJ36wBAJmBCKKleAgWGYhQkcQ8EEgqliJHoLlI4awAgImBCKLlQAhWCZhQicQ6E8guliJIILVP46wAALNCWQQK0FCsJqHCh1AoC+BLGIlighW31iidwg0JZBJrAQKwWoaLjQOgX4EsomVSCJY/eKJniHQjEBGsRKsvb17zvzYjBoNQwAChwT0QLyDq1dMaGQVK8EjwzIJITqBgA2BzGIlggiWTRzRCwRMCFy7ftOkn16dIFi9yNMvBBoQ0LTT6/PYawwXwapBkTYg4IhAZtFCsBwFGqZAoBaBrKKFYNWKENqBgDMCGUULwXIWZJgDgZoEsokWglUzOmgLAg4JZBItBMthgGESBGoTyCJaCFbtyKA9CDglkEG0ECynwYVZEGhBILpoIVgtooI2IeCYQGTRQrAcBxamQaAVgaiihWC1igjahYBzAhFFC8FyHlSYB4GWBKKJFoLVMhpoGwIBCEQSLQQrQEBhIgRaE4giWghW60igfQgEIRBBtBCsIMGEmRCwIOBdtBAsiyigDwgEIuBZtBCsQIGEqRCwIHDj629nn37+pUVXG/eBYG2MjBMgkJeAxOrCxWfdDhDBcusaDIOALQHvYiUaCJZtTNAbBFwSiCBWAodguQwfjIKAHYEoYiUiCJZdXNATBNwRiCRWgodguQshDMpIQHfdJA6etmhiJXYIlqcIwpbUBHT3zYtoRRQrBQeClfoSYXDeCHgQrahiJV8iWN4iGnvSE+gpWpHFSoGBYKW/PBigRwI9RCu6WMmPCJbHaMamIQhYilYGsVJQIFhDXBoM0isBC9HKIlbyIYLlNZKxaxgCLUUrk1gpIBCsYS4LBuqZQAvRyiZW8h+C5TmKsW0oAjVFK6NYKRgQrKEuCQbrnUAN0coqVvIdguU9grFvOAK7iFZmsVIgIFjDXQ4MOAKBbUQru1jJbwhWhOjFxiEJbCJaI4iVggDBGvJSYNBRCKwjWqOIlXyGYEWJXOwclsAy0RpJrBQACNawlwEDj0RgkWiNJlbyF4IVKWqxdWgCU9EaUazk/FN7+6cvDx0FDB4CgQi8/9Ens/2775r94flXA1ldz9S9vXvO/FivOVqCAAQg0I4AU8J2bGkZAhCoTADBqgyU5iAAgXYEEKx2bGkZAhCoTOB/5zsYyoB9+v8AAAAASUVORK5CYII=' as const;
  }

  get version() {
    return '1.0.0' as const;
  }

  get chains() {
    return SUI_CHAINS;
  }

  get accounts() {
    return this.#accounts;
  }

  constructor({ network }: { network: NETWORK }) {
    this.#accounts = [];
    this.#events = mitt();

    this.#network = network;
    this.#passkeyProvider = new PasskeyProvider('Sui Passkey');
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SuiFeatures {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.#connect,
      },
      'standard:events': {
        version: '1.0.0',
        on: this.#on,
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      'sui:signTransaction': {
        version: '2.0.0',
        signTransaction: this.#signTransaction,
      },
      'sui:signAndExecuteTransaction': {
        version: '2.0.0',
        signAndExecuteTransaction: this.#signAndExecuteTransaction,
      },
      'sui:signPersonalMessage': {
        version: '1.0.0',
        signPersonalMessage: this.#signPersonalMessage,
      },
    };
  }

  #connect: StandardConnectMethod = async (input) => {
    const getPasskeyInstance = async (provider: PasskeyProvider) => {
      const { rp, user, credential } = await provider.create2();
      if (!credential.response.getPublicKey()) {
        throw new Error('Invalid credential create response');
      } else {
        const derSPKI = credential.response.getPublicKey()!;
        const pubkeyUncompressed = parseDerSPKI(new Uint8Array(derSPKI));
        const pubkey = secp256r1.ProjectivePoint.fromHex(pubkeyUncompressed);
        const pubkeyCompressed = pubkey.toRawBytes(true);
        return {
          rp,
          user,
          credentialId: credential.id,
          signer: new PasskeyKeypair(pubkeyCompressed, provider),
        };
      }
    };

    const updateAccount = (address: string, publicKey: Uint8Array) => {
      this.#accounts = [
        new ReadonlyWalletAccount({
          address,
          publicKey,
          chains: [`sui:${this.#network}`],
          features: [
            'sui:signTransaction',
            'sui:signAndExecuteTransaction',
            'sui:signPersonalMessage',
          ],
        }),
      ];
      return {
        accounts: this.#accounts,
      };
    };

    if (this.#passkeyProvider) {
      const stored = getCredential();
      if (stored) {
        this.#signer = new PasskeyKeypair(
          fromBase64(stored.publicKey),
          this.#passkeyProvider,
        );
        return updateAccount(
          this.#signer.toSuiAddress(),
          this.#signer.getPublicKey().toRawBytes(),
        );
      } else {
        const { rp, user, signer, credentialId } = await getPasskeyInstance(
          this.#passkeyProvider,
        );
        this.#signer = signer;

        setCredential({
          rp,
          user,
          credentialId,
          publicKey: toBase64(signer.getPublicKey().toRawBytes()),
        });

        return updateAccount(
          this.#signer.toSuiAddress(),
          this.#signer.getPublicKey().toRawBytes(),
        );
      }
    }
    throw new Error('passkey provider not found');
  };

  #disconnect: StandardDisconnectMethod = async () => {
    this.#accounts = [];
    this.#signer = undefined;
    this.#events.emit('change', { accounts: undefined });
  };

  #on: StandardEventsOnMethod = (event, listener) => {
    this.#events.on(event, listener);
    return () => this.#events.off(event, listener);
  };

  #signTransaction: SuiSignTransactionMethod = async ({
    transaction,
    chain,
  }) => {
    if (this.#signer && this.#network === chain.split(':')[1]) {
      const client = new SuiClient({
        url: getFullnodeUrl(this.#network),
      });
      const txJson = await transaction.toJSON();
      const tx = Transaction.from(txJson);
      tx.setSenderIfNotSet(this.#signer.toSuiAddress());
      const txBytes = await tx.build({
        client,
      });
      const { bytes, signature } = await this.#signer.signTransaction(txBytes);
      return {
        bytes,
        signature,
      };
    }
    if (this.#network !== chain.split(':')[1]) {
      throw new Error('chain mismatch');
    }
    throw new Error('signer not found');
  };

  #signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod = async ({
    transaction,
    chain,
  }) => {
    if (this.#signer && this.#network === chain.split(':')[1]) {
      const client = new SuiClient({
        url: getFullnodeUrl(this.#network),
      });
      const txJson = await transaction.toJSON();
      const tx = Transaction.from(txJson);
      tx.setSenderIfNotSet(this.#signer.toSuiAddress());
      const txBytes = await tx.build({
        client,
      });
      const { bytes, signature } = await this.#signer.signTransaction(txBytes);
      const { digest, errors } = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: signature,
      });
      if (errors) {
        throw new Error(errors.join(', '));
      }
      const { rawEffects } = await client.waitForTransaction({
        digest,
        options: {
          showRawEffects: true,
        },
      });
      return {
        digest,
        bytes,
        signature,
        effects: rawEffects ? toBase64(new Uint8Array(rawEffects)) : '',
      };
    }
    if (this.#network !== chain.split(':')[1]) {
      throw new Error('chain mismatch');
    }
    throw new Error('signer not found');
  };

  #signPersonalMessage: SuiSignPersonalMessageMethod = async ({ message }) => {
    if (this.#signer) {
      return this.#signer.signPersonalMessage(message);
    }
    throw new Error('not implemented');
  };
}
