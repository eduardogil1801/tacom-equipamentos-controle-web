
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useLocalAuth';
import { toast } from '@/hooks/use-toast';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const success = await login(username, password);
    if (!success) {
      toast({
        title: "Erro",
        description: "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Technological background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-red-400 to-red-600 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-red-300 to-red-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-red-200 to-red-400 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-r from-red-300 to-red-500 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>

      {/* Background text */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="text-8xl font-bold text-red-600 transform rotate-12 select-none">
          SISTEMAS DE BILHETAGEM DE ÔNIBUS
        </div>
      </div>

      {/* Corner glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-200/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-red-200/30 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-auto bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl border-4 border-white/30 p-4">
            <img 
              src="/lovable-uploads/209ea11b-64cd-4e06-badc-c3738dd09eb5.png" 
              alt="TACOM Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
            Sistema de Controle
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Faça login para acessar o sistema
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/70 border-white/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-red-700">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-gray-800">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="bg-white/80 border-red-200 focus:border-red-400"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-gray-800">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="bg-white/80 border-red-200 focus:border-red-400"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
