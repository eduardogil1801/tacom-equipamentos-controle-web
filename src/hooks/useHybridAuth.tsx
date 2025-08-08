import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  username: string;
  role: 'user';
  userType: 'administrador' | 'operacional';
  mustChangePassword?: boolean;
  isTempPassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnlineMode: boolean;
  connectionStatus: 'online' | 'offline' | 'testing';
  signUp: (userData: any) => Promise<{ data: any; error: any }>;
  register: (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string) => Promise<boolean>;
  changePassword: (newPassword: string, confirmPassword?: string) => Promise<{ error: any }>;
  checkPermission: (module: string, action: string) => boolean;
  retryConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para testar conectividade com Supabase
const testConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const { error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    return !error;
  } catch (error) {
    console.log('🔍 Teste de conexão falhou:', error);
    return false;
  }
};

// Função para detectar se está online
const isOnline = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
};

// Usuários offline como fallback (baseados no seu sistema)
const offlineUsers: (User & { senha: string })[] = [
  {
    id: '1',
    email: 'eduardogil1801@gmail.com',
    name: 'Eduardo',
    surname: 'Gil',
    username: 'eduardo.gil',
    role: 'user',
    userType: 'administrador',
    senha: 'admin123'
  },
  {
    id: '4',
    email: 'mauro.hubie@tacom.com.br',
    name: 'Mauro',
    surname: 'Hubie',
    username: 'mauro.hubie',
    role: 'user',
    userType: 'administrador',
    senha: 'admin123'
  },
  {
    id: '2',
    email: 'elmiro.canabarro@tacom.com.br',
    name: 'Elmiro',
    surname: 'Canabarro',
    username: 'elmiro.canabarro',
    role: 'user',
    userType: 'operacional',
    senha: 'senha123',
    mustChangePassword: true,
    isTempPassword: true
  },
  {
    id: '3',
    email: 'fernando.duarte@tacom.com.br',
    name: 'Fernando',
    surname: 'Duarte',
    username: 'fernando.juliano',
    role: 'user',
    userType: 'operacional',
    senha: 'senha123',
    mustChangePassword: true,
    isTempPassword: true
  },
  {
    id: '99',
    email: 'admin@tacom.com',
    name: 'Administrador',
    surname: 'Sistema',
    username: 'admin',
    role: 'user',
    userType: 'administrador',
    senha: 'admin'
  }
];

export const HybridAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'testing'>('testing');

  useEffect(() => {
    initializeAuth();
    
    // Listeners para mudanças de conectividade
    const handleOnline = () => {
      console.log('🌐 Conexão detectada, testando Supabase...');
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log('❌ Conexão perdida, mudando para modo offline');
      setConnectionStatus('offline');
      setIsOnlineMode(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeAuth = async () => {
    await checkConnection();
    await loadUser();
  };

  const checkConnection = async () => {
    setConnectionStatus('testing');
    console.log('🔍 Testando conexão com Supabase...');
    
    if (!isOnline()) {
      console.log('❌ Navegador offline');
      setConnectionStatus('offline');
      setIsOnlineMode(false);
      return false;
    }

    const connected = await testConnection();
    if (connected) {
      console.log('✅ Conectado ao Supabase - Modo Online');
      setConnectionStatus('online');
      setIsOnlineMode(true);
      return true;
    } else {
      console.log('⚠️ Supabase inacessível - Modo Offline');
      setConnectionStatus('offline');
      setIsOnlineMode(false);
      return false;
    }
  };

  const retryConnection = () => {
    console.log('🔄 Tentando reconectar...');
    checkConnection();
  };

  const loadUser = async () => {
    try {
      console.log('👤 Carregando sessão do usuário...');
      
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log(`✅ Sessão restaurada: ${userData.name} ${userData.surname} (${userData.userType})`);
      } else {
        console.log('ℹ️ Nenhuma sessão salva');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sessão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginOnline = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('🌐 Tentando login online...');
      
      const { data: users, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          user_profiles!inner(user_type)
        `)
        .or(`email.eq.${email},username.eq.${email}`)
        .eq('senha', password)
        .eq('ativo', true)
        .single();

      if (error) {
        console.log('❌ Erro no login online:', error.message);
        return null;
      }

      if (!users) {
        console.log('❌ Usuário não encontrado online');
        return null;
      }

      console.log('✅ Login online bem sucedido');
      return {
        id: users.id,
        email: users.email,
        name: users.nome,
        surname: users.sobrenome,
        username: users.username,
        role: 'user',
        userType: users.user_profiles.user_type,
        mustChangePassword: users.must_change_password || false,
        isTempPassword: users.is_temp_password || false
      };
    } catch (error) {
      console.error('❌ Exceção no login online:', error);
      return null;
    }
  };

  const loginOffline = async (email: string, password: string): Promise<User | null> => {
    console.log('💾 Tentando login offline...');
    
    const foundUser = offlineUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.username.toLowerCase() === email.toLowerCase()
    );
    
    if (foundUser && foundUser.senha === password) {
      console.log('✅ Login offline bem sucedido');
      const { senha, ...userWithoutPassword } = foundUser;
      return userWithoutPassword;
    }
    
    console.log('❌ Credenciais offline inválidas');
    console.log('💡 Usuários offline disponíveis:');
    offlineUsers.forEach(u => {
      console.log(`  - ${u.username} (${u.email}) - Senha: ${u.senha}`);
    });
    
    return null;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log(`🔑 Iniciando login para: ${email}`);
      console.log(`📡 Status de conexão: ${connectionStatus}`);
      
      let loggedUser: User | null = null;
      
      if (isOnlineMode) {
        // Tentar login online primeiro
        loggedUser = await loginOnline(email, password);
        
        if (!loggedUser) {
          console.log('⚠️ Falha no login online, tentando offline como fallback...');
          loggedUser = await loginOffline(email, password);
        }
      } else {
        // Modo offline
        loggedUser = await loginOffline(email, password);
      }
      
      if (loggedUser) {
        setUser(loggedUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedUser));
        
        console.log(`🎉 Login realizado com sucesso!`);
        console.log(`👤 Usuário: ${loggedUser.name} ${loggedUser.surname}`);
        console.log(`🔧 Tipo: ${loggedUser.userType}`);
        console.log(`📧 Email: ${loggedUser.email}`);
        console.log(`🌐 Modo: ${isOnlineMode ? 'Online' : 'Offline'}`);
        
        if (loggedUser.mustChangePassword) {
          console.log('⚠️ Usuário deve alterar senha na próxima oportunidade');
        }
        
        return true;
      }
      
      console.log('❌ Login falhou - credenciais inválidas');
      return false;
    } catch (error) {
      console.error('💥 Erro crítico no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log(`👋 Logout do usuário: ${user?.name} ${user?.surname}`);
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const signUp = async (userData: any) => {
    console.log('📝 Tentativa de registro:', userData);
    if (isOnlineMode) {
      return { data: null, error: 'Registro online será implementado em breve' };
    }
    return { data: null, error: 'Registro não disponível em modo offline' };
  };

  const register = async (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string): Promise<boolean> => {
    console.log('📝 Registro solicitado para:', { name, surname, email, username });
    return false; // Não implementado ainda
  };

  const changePassword = async (newPassword: string, confirmPassword?: string) => {
    console.log(`🔑 Solicitação de alteração de senha para: ${user?.username}`);
    
    if (confirmPassword && newPassword !== confirmPassword) {
      return { error: { message: 'As senhas não coincidem' } };
    }
    
    if (isOnlineMode && user) {
      try {
        console.log('🌐 Alterando senha online...');
        
        const { error } = await supabase
          .from('usuarios')
          .update({
            senha: newPassword,
            must_change_password: false,
            is_temp_password: false
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ Erro ao alterar senha online:', error);
          return { error: { message: 'Erro ao alterar senha no servidor' } };
        }
        
        console.log('✅ Senha alterada online com sucesso');
      } catch (error) {
        console.error('❌ Exceção ao alterar senha online:', error);
        return { error: { message: 'Erro de conexão ao alterar senha' } };
      }
    }
    
    // Atualizar usuário local (tanto online quanto offline)
    if (user) {
      const updatedUser = {
        ...user,
        mustChangePassword: false,
        isTempPassword: false
      };
      
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('✅ Senha atualizada localmente');
    }
    
    return { error: null };
  };

  const checkPermission = (module: string, action: string) => {
    console.log('🔍 Verificando permissão:', { 
      module, 
      action, 
      user: user ? `${user.name} ${user.surname}` : 'Nenhum',
      userType: user?.userType 
    });
    
    // Administradores têm acesso total
    if (user?.userType === 'administrador') {
      console.log('✅ Permissão liberada - usuário é administrador');
      return true;
    }
    
    // Usuários operacionais têm permissões limitadas
    if (user?.userType === 'operacional') {
      const operationalPermissions = {
        'dashboard': ['view'],
        'equipments': ['view', 'create', 'edit'], 
        'companies': ['view'],
        'reports': ['view'],
        'fleet': ['view'],
        'protocol': [], // Sem acesso
        'settings': [], // Sem acesso
        'users': [] // Sem acesso
      };
      
      const modulePermissions = operationalPermissions[module as keyof typeof operationalPermissions] || [];
      const hasPermission = modulePermissions.includes(action);
      
      console.log(hasPermission ? '✅ Permissão liberada - usuário operacional' : '❌ Permissão negada - usuário operacional');
      console.log(`📋 Permissões para ${module}:`, modulePermissions);
      return hasPermission;
    }
    
    console.log('❌ Permissão negada - usuário sem tipo definido ou não logado');
    return false;
  };

  console.log('🎛️ HybridAuthProvider renderizando:', { 
    user: user ? `${user.name} ${user.surname} (${user.userType})` : null, 
    isLoading,
    connectionStatus,
    isOnlineMode,
    mustChangePassword: user?.mustChangePassword
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated: !!user,
      isOnlineMode,
      connectionStatus,
      signUp, 
      register,
      changePassword,
      checkPermission,
      retryConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a HybridAuthProvider');
  }
  return context;
};