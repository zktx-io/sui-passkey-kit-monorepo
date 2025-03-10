export const getCredential = ():
  | {
      credential: Credential;
      publicKey: string;
    }
  | undefined => {
  const data = localStorage.getItem('credential');
  return data ? JSON.parse(data) : undefined;
};

export const setCredential = (data: {
  credential: Credential;
  publicKey: string;
}) => {
  localStorage.setItem('credential', JSON.stringify(data));
};

export const resetCredential = () => {
  localStorage.clear();
};
