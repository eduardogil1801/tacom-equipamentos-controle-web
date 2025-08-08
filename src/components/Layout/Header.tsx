
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, FileText, Package, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useHybridAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, permission: 'dashboard' },
    { id: 'equipment', label: 'Equipamentos', icon: Package, permission: 'equipment' },
    { id: 'fleet', label: 'Frota', icon: Truck, permission: 'fleet' },
    { id: 'reports', label: 'Relatórios', icon: FileText, permission: 'reports' },
    { id: 'settings', label: 'Configurações', icon: Settings, permission: 'settings' }
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="tacom-gradient text-white px-4 py-2 rounded-lg font-bold text-xl">
              TACOM
            </div>
            <span className="ml-3 text-gray-600 text-sm">
              Controle de Equipamentos - Filial POA
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user?.name} {user?.surname}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <User className="h-4 w-4 mr-2" />
                  {user?.name} {user?.surname}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <span className="text-xs text-gray-500">
                    {user?.userType === 'administrador' ? 'Administrador' : 'Operacional'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
