// Simple user data store for demo purposes
export interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  username?: string;
  role: 'admin' | 'user';
  userType: 'administrador' | 'operacional';
}

export interface UserWithPassword extends User {
  password: string;
}

export const defaultUsers: UserWithPassword[] = [
  {
    id: '1',
    email: 'admin@teste.com',
    name: 'Administrador',
    username: 'admin',
    password: '123456',
    role: 'admin',
    userType: 'administrador'
  },
  {
    id: '2',
    email: 'operador@teste.com',
    name: 'Operador',
    username: 'operador',
    password: '123456',
    role: 'user',
    userType: 'operacional'
  },
  {
    id: '3',
    email: 'eduardo.gil@teste.com',
    name: 'Eduardo',
    surname: 'Gil',
    username: 'eduardo.gil',
    password: '12345678',
    role: 'user',
    userType: 'operacional'
  }
];

// Initialize users in localStorage if not present
export const initializeUsers = () => {
  const existingUsers = localStorage.getItem('localUsers');
  if (!existingUsers) {
    localStorage.setItem('localUsers', JSON.stringify(defaultUsers));
    console.log('Usuários padrão criados:');
    console.log('Admin: admin@teste.com / 123456');
    console.log('Operador: operador@teste.com / 123456');
  }
};