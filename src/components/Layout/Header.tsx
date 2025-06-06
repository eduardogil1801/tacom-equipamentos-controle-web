
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { id: 'equipments', label: 'Equipamentos' },
    { id: 'companies', label: 'Empresas' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'protocol', label: 'Protocolo' },
  ];

  const reportItems = [
    { id: 'reports-inventory', label: 'Relatório de Estoque' },
    { id: 'reports-movements', label: 'Movimentações' },
    { id: 'reports-companies', label: 'Relatório de Empresas' },
    { id: 'reports-equipment-status', label: 'Status dos Equipamentos' },
    { id: 'reports-monthly', label: 'Relatório Mensal' },
    { id: 'reports-equipment-history', label: 'Histórico de Equipamentos' }
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="tacom-gradient text-white p-2 rounded-lg">
              <h1 className="text-xl font-bold">TACOM</h1>
            </div>
            <span className="ml-3 text-gray-600 text-sm">Controle de Equipamentos - Filial POA</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                onClick={() => onNavigate(item.id)}
                className={currentPage === item.id ? 'bg-primary text-white' : ''}
              >
                {item.label}
              </Button>
            ))}
            
            {/* Relatórios Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={currentPage.startsWith('reports') ? 'default' : 'ghost'}
                  className={currentPage.startsWith('reports') ? 'bg-primary text-white' : ''}
                >
                  Relatórios
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {reportItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={currentPage === item.id ? 'bg-primary/10' : ''}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Olá, {user?.name} {user?.surname}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start ${currentPage === item.id ? 'bg-primary text-white' : ''}`}
                >
                  {item.label}
                </Button>
              ))}
              
              {/* Mobile Relatórios Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={currentPage.startsWith('reports') ? 'default' : 'ghost'}
                    className={`w-full justify-start ${currentPage.startsWith('reports') ? 'bg-primary text-white' : ''}`}
                  >
                    Relatórios
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {reportItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={currentPage === item.id ? 'bg-primary/10' : ''}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
