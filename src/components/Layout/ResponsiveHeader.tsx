
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  LayoutDashboard, 
  Package, 
  Building2, 
  FileText, 
  Truck, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ResponsiveHeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, checkPermission } = useAuth();

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Definir todos os módulos disponíveis
  const allModules = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { key: 'equipments', label: 'Equipamentos', icon: Package, page: 'equipment' },
    { key: 'equipments', label: 'Movimentação', icon: ArrowRightLeft, page: 'movements' },
    { key: 'companies', label: 'Empresas', icon: Building2, page: 'companies' },
    { key: 'reports', label: 'Relatórios', icon: FileText, page: 'reports' },
    { key: 'fleet', label: 'Frota', icon: Truck, page: 'fleet' },
    { key: 'protocol', label: 'Protocolo', icon: ClipboardList, page: 'protocol' },
    { key: 'users', label: 'Usuários', icon: Users, page: 'users' },
    { key: 'settings', label: 'Configurações', icon: Settings, page: 'settings' }
  ];

  // Filtrar módulos baseado nas permissões do usuário
  const availableModules = allModules.filter(module => {
    // Administradores têm acesso a tudo
    if (user?.userType === 'administrador') {
      return true;
    }
    
    // Para usuários operacionais, verificar permissão de visualização
    return checkPermission(module.key, 'view');
  });

  const getPageTitle = (page: string) => {
    const module = allModules.find(m => m.page === page);
    return module ? module.label : 'TACOM';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col h-full">
              <div className="py-4 border-b">
                <h2 className="text-lg font-semibold">TACOM</h2>
                <p className="text-sm text-gray-600">
                  {user?.name} {user?.surname}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.userType}
                </p>
              </div>
              
              <nav className="flex-1 py-4">
                <ul className="space-y-2">
                  {availableModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <li key={`${module.key}-${module.page}`}>
                        <Button
                          variant={currentPage === module.page ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handlePageChange(module.page)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {module.label}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-xl font-semibold text-gray-900">
          {getPageTitle(currentPage)}
        </h1>
      </div>
      
      <div className="hidden md:flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {user?.name} {user?.surname}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};

export default ResponsiveHeader;
