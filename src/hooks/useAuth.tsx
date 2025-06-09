
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserPermission } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('tacom-user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadUserPermissions(userData.id);
    }
    setIsLoading(false);
  }, []);

  const loadUserPermissions = async (userId: string) => {
    try {
      const { data: userPermissions, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        return;
      }

      setPermissions(userPermissions || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Verificar credenciais no banco de dados usando username
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          user_profiles!inner(user_type)
        `)
        .eq('username', username)
        .eq('senha', password)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao fazer login:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar credenciais.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      if (usuarios && usuarios.length > 0) {
        const usuario = usuarios[0];
        const userData = {
          id: usuario.id,
          name: usuario.nome,
          surname: usuario.sobrenome,
          email: usuario.email,
          username: usuario.username,
          userType: usuario.user_profiles.user_type,
          mustChangePassword: usuario.must_change_password,
          isTempPassword: usuario.is_temp_password
        };
        
        setUser(userData);
        localStorage.setItem('tacom-user', JSON.stringify(userData));
        await loadUserPermissions(usuario.id);
        
        setIsLoading(false);
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Credenciais inválidas.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, surname: string, email: string, username: string, password: string, confirmPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }

    try {
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('username')
        .eq('username', username);

      if (existingUser && existingUser.length > 0) {
        toast({
          title: "Erro",
          description: "Este username já está cadastrado.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // Inserir novo usuário
      const { data: newUser, error } = await supabase
        .from('usuarios')
        .insert({
          nome: name,
          sobrenome: surname,
          email: email,
          username: username,
          senha: password
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar usuário:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar conta. Tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // Criar perfil padrão como operacional
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: newUser.id,
          user_type: 'operacional'
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }

      if (newUser) {
        const userData = {
          id: newUser.id,
          name: newUser.nome,
          surname: newUser.sobrenome,
          email: newUser.email,
          username: newUser.username,
          userType: 'operacional' as const,
          mustChangePassword: false,
          isTempPassword: false
        };
        
        setUser(userData);
        localStorage.setItem('tacom-user', JSON.stringify(userData));
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso!",
        });
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Erro durante registro:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
    
    setIsLoading(false);
    return false;
  };

  const changePassword = async (newPassword: string, confirmPassword: string): Promise<boolean> => {
    if (!user) return false;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return false;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          senha: newPassword,
          must_change_password: false,
          is_temp_password: false
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar senha.",
          variant: "destructive",
        });
        return false;
      }

      // Atualizar estado do usuário
      const updatedUser = {
        ...user,
        mustChangePassword: false,
        isTempPassword: false
      };
      setUser(updatedUser);
      localStorage.setItem('tacom-user', JSON.stringify(updatedUser));

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor.",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    // Administradores têm acesso total
    if (user?.userType === 'administrador') {
      return true;
    }

    // Verificar permissão específica
    const permission = permissions.find(p => p.module_name === module);
    if (!permission) return false;

    switch (action) {
      case 'view':
        return permission.can_view;
      case 'create':
        return permission.can_create;
      case 'edit':
        return permission.can_edit;
      case 'delete':
        return permission.can_delete;
      default:
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('tacom-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, changePassword, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
