
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('tacom-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Verificar credenciais no banco de dados
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
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
          email: usuario.email
        };
        
        setUser(userData);
        localStorage.setItem('tacom-user', JSON.stringify(userData));
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

  const register = async (name: string, surname: string, email: string, password: string, confirmPassword: string): Promise<boolean> => {
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
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email);

      if (existingUser && existingUser.length > 0) {
        toast({
          title: "Erro",
          description: "Este email já está cadastrado.",
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

      if (newUser) {
        const userData = {
          id: newUser.id,
          name: newUser.nome,
          surname: newUser.sobrenome,
          email: newUser.email
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tacom-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
