export interface ISuiPasskeyData {
  rp: {
    name: string;
    id: string;
  };
  user: {
    name: string;
    displayName: string;
  };
  credentialId: string;
  publicKey: string;
}

export const getCredential = (): ISuiPasskeyData | undefined => {
  const data = localStorage.getItem('credential');
  return data ? JSON.parse(data) : undefined;
};

export const setCredential = (data: ISuiPasskeyData) => {
  localStorage.setItem('credential', JSON.stringify(data));
};

export const resetCredential = () => {
  localStorage.clear();
};
