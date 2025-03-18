import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, LogIn, LogOut, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userId, setUserId] = useState(null);

  // Lista de usuários que só visualizam o Power BI
  const powerBIUsers = ['admin_oficinas@sanpedrocargo.com', 'admin_ruta@sanpedrocargo.com'];

  // Verifica se o usuário atual é um dos usuários específicos
  const isPowerBIUser = powerBIUsers.includes(email);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) {
        toast.error('Usuario o contraseña inválidos');
        return;
      }

      setIsLoggedIn(true);
      setUserId(user.id);
      toast.success('Inicio de sesión exitoso!');
    } catch (error) {
      toast.error('Error al iniciar sesión. Inténtelo de nuevo.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <Truck className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Sistema de Registro
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-blue-800" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  San Pedro Cargo
                </h1>
                <p className="text-sm text-gray-500">
                  Sistema de Registro
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span>{email}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span>{currentTime.toLocaleTimeString('es-ES')}</span>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setPassword('');
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {isPowerBIUser ? (
        // Exibe o Power BI em tela cheia para os usuários específicos
        <div className="flex-1 p-4">
          <iframe
            title="horas"
            width="100%"
            height="100%"
            style={{ minHeight: 'calc(100vh - 80px)' }} // Ajusta a altura para ocupar o restante da tela
            src="https://app.powerbi.com/view?r=eyJrIjoiMmY1NjkzNmYtYjEyMy00MGY0LTk4MWYtYWE5NTY4Nzk1ZDBmIiwidCI6IjljNzI4NmYyLTg0OTUtNDgzZi1hMTc4LTQwMjZmOWU0ZTM2MiIsImMiOjR9"
            frameBorder="0"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      ) : (
        // Exibe o conteúdo normal para outros usuários
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Conteúdo normal para outros usuários */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estado del Turno
            </h2>
            <p className="text-sm text-gray-600">
              Aqui você pode ver o estado do turno e outras informações.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;