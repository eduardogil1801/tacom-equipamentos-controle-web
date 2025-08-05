
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useLocalAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import CompanyList from './CompanyList';

const CompanyManager: React.FC = () => {
  const { user, checkPermission } = useAuth();

  // Verificar se o usuário tem permissão para visualizar empresas
  const canView = user?.userType === 'administrador' || checkPermission('companies', 'view');

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-96 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Shield className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-500">
              Você não possui permissão para acessar o módulo de empresas. 
              Entre em contato com o administrador do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CompanyList />;
};

export default CompanyManager;
