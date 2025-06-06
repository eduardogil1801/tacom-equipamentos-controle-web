
import React, { useState } from 'react';
import { Menu, X, LogOut, Building, Database, BarChart2, FileText, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'equipments', label: 'Equipamentos', icon: Database },
    { id: 'companies', label: 'Empresas', icon: Building },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'protocol', label: 'Protocolo', icon: Printer },
  ];

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="tacom-gradient text-white px-4 py-2 rounded-lg font-bold text-xl">
              TACOM
            </div>
            <span className="ml-3 text-gray-600 font-medium">Filial POA</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  className={`flex items-center space-x-2 ${
                    currentPage === item.id ? 'bg-primary text-white' : 'text-gray-700 hover:text-primary'
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Olá, {user?.name} {user?.surname}
            </span>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <div className="px-4 py-2 text-sm text-gray-600 border-b">
                {user?.name} {user?.surname}
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    className={`justify-start flex items-center space-x-2 ${
                      currentPage === item.id ? 'bg-primary text-white' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="justify-start flex items-center space-x-2 mt-4"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
