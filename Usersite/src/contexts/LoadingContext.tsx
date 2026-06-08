import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const value = useMemo(
    () => ({ isLoading, setIsLoading }),
    [isLoading],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

const defaultLoadingContext: LoadingContextType = {
  isLoading: false,
  setIsLoading: () => {},
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  return context ?? defaultLoadingContext;
};
