import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PostCreationContextType {
  isVisible: boolean;
  showPostCreation: () => void;
  hidePostCreation: () => void;
}

const PostCreationContext = createContext<PostCreationContextType | undefined>(undefined);

export const usePostCreation = () => {
  const context = useContext(PostCreationContext);
  if (!context) {
    throw new Error('usePostCreation must be used within PostCreationProvider');
  }
  return context;
};

interface PostCreationProviderProps {
  children: ReactNode;
}

export const PostCreationProvider: React.FC<PostCreationProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showPostCreation = () => setIsVisible(true);
  const hidePostCreation = () => setIsVisible(false);

  return (
    <PostCreationContext.Provider value={{ isVisible, showPostCreation, hidePostCreation }}>
      {children}
    </PostCreationContext.Provider>
  );
};
