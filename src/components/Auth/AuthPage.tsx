
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {isLogin ? (
        <LoginForm onToggleForm={handleToggleForm} />
      ) : (
        <RegisterForm onToggleForm={handleToggleForm} />
      )}
    </div>
  );
};

export default AuthPage;
