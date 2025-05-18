import { createContext, useContext, useState } from 'react';

const SharedStateContext = createContext();

export const SharedStateProvider = ({ children }) => {
  const [text, setText] = useState('Hover over products to see details');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('Product Details');
  const [user, setUser] = useState('<Wallet Address>');
  
  return (
    <SharedStateContext.Provider value={{ text, setText, desc, setDesc , price , setPrice, user , setUser }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => {
  return useContext(SharedStateContext);
};
