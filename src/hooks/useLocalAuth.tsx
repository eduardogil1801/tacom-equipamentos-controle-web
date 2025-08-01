import { createContext, useContext, useEffect, useState } from 'react';
import { getFromTable, addToTable } from '@/utils/localStorage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const LocalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('tacom_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = getFromTable('users');
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const userSession = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name || foundUser.email,
          role: foundUser.role || 'user'
        };
        
        setUser(userSession);
        localStorage.setItem('tacom_current_user', JSON.stringify(userSession));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tacom_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useLocalAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider');
  }
  return context;
};