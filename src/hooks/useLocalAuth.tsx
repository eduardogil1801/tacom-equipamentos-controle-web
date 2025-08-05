import { createContext, useContext, useEffect, useState } from 'react';
import { isElectron, ElectronDatabase } from '@/utils/electronDatabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  userType: 'administrador' | 'operacional';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (userData: any) => Promise<{ data: any; error: any }>;
  changePassword: (newPassword: string) => Promise<{ error: any }>;
  checkPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const LocalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (isElectron) {
        // No Electron, carregar do localStorage ou verificar sessão
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      let foundUser = null;
      
      if (isElectron) {
        // Login via Electron/SQLite
        foundUser = await ElectronDatabase.login(email, password);
      } else {
        // Fallback para web/localStorage (desenvolvimento)
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        foundUser = users.find((u: any) => u.email === email && u.password === password);
      }
      
      if (foundUser) {
        const userSession = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name || foundUser.email,
          role: foundUser.role || 'user',
          userType: foundUser.userType || 'administrador'
        };
        
        setUser(userSession);
        localStorage.setItem('currentUser', JSON.stringify(userSession));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const signUp = async (userData: any) => {
    try {
      if (isElectron) {
        const result = await ElectronDatabase.insert('usuarios', {
          ...userData,
          id: Date.now().toString(),
          role: userData.role || 'user'
        });
        return { data: result, error: null };
      } else {
        // Fallback para localStorage
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const newUser = {
          ...userData,
          id: Date.now().toString(),
          role: userData.role || 'user'
        };
        users.push(newUser);
        localStorage.setItem('localUsers', JSON.stringify(users));
        return { data: newUser, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      if (user && isElectron) {
        await ElectronDatabase.update('usuarios', user.id, { password: newPassword });
        return { error: null };
      }
      return { error: { message: 'Não foi possível alterar a senha' } };
    } catch (error) {
      return { error };
    }
  };

  const checkPermission = (module: string, action: string) => {
    // Administradores têm acesso total
    if (user?.userType === 'administrador') {
      return true;
    }
    // Para simplicidade, usuários operacionais têm acesso básico
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated: !!user,
      signUp, 
      changePassword,
      checkPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a LocalAuthProvider');
  }
  return context;
};