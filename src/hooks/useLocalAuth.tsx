import { createContext, useContext, useEffect, useState } from 'react';

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
  signUp: (userData: any) => Promise<{ data: any; error: any }>;
  register: (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string) => Promise<boolean>;
  changePassword: (newPassword: string, confirmPassword?: string) => Promise<{ error: any }>;
  checkPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários baseados na sua estrutura atual do Supabase
const systemUsers: (User & { senha: string })[] = [
  // Administradores
  {
    id: '1',
    email: 'eduardogil1801@gmail.com',
    name: 'Eduardo',
    surname: 'Gil',
    username: 'eduardo.gil',
    role: 'user',
    userType: 'administrador',
    senha: 'admin123', // Senha temporária para teste
    mustChangePassword: false,
    isTempPassword: false
  },
  {
    id: '4',
    email: 'mauro.hubie@tacom.com.br',
    name: 'Mauro',
    surname: 'Hubie',
    username: 'mauro.hubie',
    role: 'user',
    userType: 'administrador',
    senha: 'admin123', // Senha temporária para teste
    mustChangePassword: false,
    isTempPassword: false
  },
  // Operacionais
  {
    id: '2',
    email: 'elmiro.canabarro@tacom.com.br',
    name: 'Elmiro',
    surname: 'Canabarro',
    username: 'elmiro.canabarro',
    role: 'user',
    userType: 'operacional',
    senha: 'senha123', // Senha temporária para teste
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
    senha: 'senha123', // Senha temporária para teste
    mustChangePassword: true,
    isTempPassword: true
  },
  // Usuário admin genérico para compatibilidade
  {
    id: '99',
    email: 'admin@tacom.com',
    name: 'Administrador',
    surname: 'Sistema',
    username: 'admin',
    role: 'user',
    userType: 'administrador',
    senha: 'admin',
    mustChangePassword: false,
    isTempPassword: false
  }
];

export const LocalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('🔍 Carregando usuário...');
      console.log('👥 Usuários disponíveis no sistema:');
      
      systemUsers.forEach(u => {
        console.log(`  - ${u.name} ${u.surname} (${u.username}) - ${u.userType}`);
        console.log(`    Email: ${u.email}`);
        console.log(`    Senha: ${u.senha} ${u.mustChangePassword ? '⚠️ Precisa alterar senha' : '✅'}`);
      });
      
      // Load current user session
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        console.log('✅ Usuário encontrado no localStorage');
        const userData = JSON.parse(savedUser);
        // Verificar se o usuário ainda existe na lista
        const existingUser = systemUsers.find(u => u.id === userData.id);
        if (existingUser) {
          setUser(userData);
          console.log(`🎯 Usuário logado: ${userData.name} ${userData.surname} (${userData.userType})`);
        } else {
          console.log('⚠️ Usuário salvo não existe mais, limpando localStorage');
          localStorage.removeItem('currentUser');
        }
      } else {
        console.log('ℹ️ Nenhum usuário salvo encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
      console.log('✅ Carregamento de usuário finalizado');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 Tentando login com:', { email, password });
      setIsLoading(true);
      
      // Buscar usuário por email ou username (case insensitive)
      const foundUser = systemUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() || 
        u.username.toLowerCase() === email.toLowerCase()
      );
      
      if (foundUser && foundUser.senha === password) {
        // Remover senha do objeto user para segurança
        const { senha, ...userWithoutPassword } = foundUser;
        
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        console.log('✅ Login bem sucedido!');
        console.log(`👤 Usuário: ${foundUser.name} ${foundUser.surname}`);
        console.log(`🔧 Tipo: ${foundUser.userType}`);
        console.log(`📧 Email: ${foundUser.email}`);
        
        if (foundUser.mustChangePassword) {
          console.log('⚠️ Usuário precisa alterar senha');
        }
        
        return true;
      }
      
      console.log('❌ Credenciais inválidas');
      console.log('💡 Credenciais disponíveis:');
      systemUsers.forEach(u => {
        console.log(`  📧 ${u.email} | 👤 ${u.username} | 🔑 ${u.senha} | 🔧 ${u.userType}`);
      });
      
      return false;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Fazendo logout do usuário:', user?.name);
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const signUp = async (userData: any) => {
    console.log('📝 SignUp chamado:', userData);
    return { data: null, error: 'Registro não implementado no modo offline' };
  };

  const register = async (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string): Promise<boolean> => {
    console.log('📝 Register chamado para:', { name, surname, email, username });
    // No modo offline, não permitir registro
    return false;
  };

  const changePassword = async (newPassword: string, confirmPassword?: string) => {
    console.log('🔑 ChangePassword chamado para:', user?.username);
    
    if (confirmPassword && newPassword !== confirmPassword) {
      return { error: { message: 'As senhas não coincidem' } };
    }
    
    if (user) {
      // Simular alteração de senha
      const updatedUser = {
        ...user,
        mustChangePassword: false,
        isTempPassword: false
      };
      
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('✅ Senha alterada com sucesso (simulado)');
      
      return { error: null };
    }
    
    return { error: { message: 'Usuário não encontrado' } };
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

  console.log('🎛️ AuthProvider renderizando com:', { 
    user: user ? `${user.name} ${user.surname} (${user.userType})` : null, 
    isLoading,
    mustChangePassword: user?.mustChangePassword
  });

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