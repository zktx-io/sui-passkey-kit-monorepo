export const getCredential = ():
  | {
      credentialId: string;
      publicKey: string;
    }
  | undefined => {
  const data = localStorage.getItem('credential');
  return data ? JSON.parse(data) : undefined;
};

export const setCredential = (data: {
  credentialId: string;
  publicKey: string;
}) => {
  localStorage.setItem('credential', JSON.stringify(data));
};

export const resetCredential = () => {
  localStorage.clear();
};
