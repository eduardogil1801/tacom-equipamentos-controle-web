import { createContext, useContext, useEffect, useState } from 'react';
import { initializeUsers, type User } from '@/data/users';
import { supabase } from '@/integrations/supabase/client';


interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (userData: any) => Promise<{ data: any; error: any }>;
  register: (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string) => Promise<boolean>;
  changePassword: (newPassword: string, confirmPassword?: string) => Promise<{ error: any }>;
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
      // Initialize default users
      initializeUsers();
      
      // Load current user session
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
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
      
      // Buscar usuário no Supabase
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`email.eq.${email},username.eq.${email}`)
        .eq('senha', password)
        .single();

      console.log('Tentando login com:', { email, password });
      console.log('Resultado do Supabase:', { users, error });
      
      if (users && !error) {
        const userSession: User = {
          id: users.id,
          email: users.email,
          name: users.nome || users.email,
          surname: users.sobrenome || '',
          username: users.username,
          role: 'user' as 'user',
          userType: 'administrador' as 'administrador'
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
      // Usar localStorage
      const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        role: userData.role || 'user'
      };
      users.push(newUser);
      localStorage.setItem('localUsers', JSON.stringify(users));
      return { data: newUser, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const register = async (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      if (password !== confirmPassword) {
        return false;
      }
      
      const userData = { name, surname, email, username, password };
      const result = await signUp(userData);
      
      if (result.error) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const changePassword = async (newPassword: string, confirmPassword?: string) => {
    try {
      if (confirmPassword && newPassword !== confirmPassword) {
        return { error: { message: 'As senhas não coincidem' } };
      }
      
      if (user) {
        // Atualizar no localStorage
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, password: newPassword } : u
        );
        localStorage.setItem('localUsers', JSON.stringify(updatedUsers));
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
      register,
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