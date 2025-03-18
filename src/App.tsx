import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [customWorkplace, setCustomWorkplace] = useState('');
  const [timeEntry, setTimeEntry] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userId, setUserId] = useState(null);
  const [lastEntry, setLastEntry] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);

  // Verificar sessão ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserId(session.user.id);
        setEmail(session.user.email);
        fetchLastEntry();
        fetchAllEntries();
        fetchWorkspaces();
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (isWorking && timeEntry) {
      interval = setInterval(() => {
        setElapsedTime(new Date().getTime() - new Date(timeEntry.start_time).getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking, timeEntry]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position.coords);
        },
        () => {
          toast.error('No se pudo obtener su ubicación');
        }
      );
    }
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;

      setWorkspaces(data);
      if (data.length > 0) {
        setWorkplace(data[0].name);
      }
    } catch (error) {
      console.error('Error al buscar espacios de trabajo:', error);
      toast.error('Error al cargar los lugares de trabajo');
    }
  };

  const fetchLastEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setLastEntry(data);
        setTimeEntry(data);
        setIsWorking(true);
        toast('Tienes un registro pendiente!', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error al buscar último registro pendiente:', error);
    }
  };

  const fetchAllEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(7);

      if (error) throw error;

      if (data) {
        setAllEntries(data);
      }
    } catch (error) {
      console.error('Error al buscar todos los registros:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
      fetchLastEntry();
      fetchAllEntries();
      fetchWorkspaces();
    } catch (error) {
      toast.error('Error al iniciar sesión. Inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!isLoggedIn || !userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const selectedWorkplace = workplace === 'Otro' ? customWorkplace : workplace;

            const newEntry = {
              user_id: userId,
              workplace: selectedWorkplace,
              start_time: new Date().toISOString(),
              start_latitude: position.coords.latitude,
              start_longitude: position.coords.longitude,
            };

            const { data: entry, error } = await supabase
              .from('time_entries')
              .insert([newEntry])
              .select()
              .single();

            if (error) throw error;

            setTimeEntry(entry);
            setIsWorking(true);
            setCurrentLocation(position.coords);
            localStorage.setItem('timeEntry', JSON.stringify(entry));
            toast.success('Inicio del turno registrado!');
            fetchAllEntries();
          } catch (error) {
            console.error('Error al iniciar el turno:', error);
            toast.error('Error al registrar el inicio del turno');
          } finally {
            setIsProcessing(false);
          }
        },
        () => {
          toast.error('No se pudo obtener su ubicación');
          setIsProcessing(false);
        }
      );
    }
  };

  const handleEndWork = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada');
      return;
    }

    if (!timeEntry?.id) {
      toast.error('No se encontró ningún turno activo');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const updates = {
            end_time: new Date().toISOString(),
            end_latitude: position.coords.latitude,
            end_longitude: position.coords.longitude,
          };

          const { data: updatedEntry, error } = await supabase
            .from('time_entries')
            .update(updates)
            .eq('id', timeEntry.id)
            .select()
            .single();

          if (error) throw error;

          const totalTime = formatDuration(new Date(updates.end_time).getTime() - new Date(timeEntry.start_time).getTime());
          toast.success(`Turno finalizado! Tiempo total trabajado: ${totalTime}`);

          setTimeEntry(null);
          setIsWorking(false);
          setElapsedTime(0);
          setCurrentLocation(null);
          localStorage.removeItem('timeEntry');
          setLastEntry(null);
          fetchAllEntries();
        } catch (error) {
          console.error('Error al finalizar el turno:', error);
          toast.error('Error al registrar el fin del turno');
        } finally {
          setIsProcessing(false);
        }
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
        toast.error('No se pudo obtener su ubicación');
        setIsProcessing(false);
      }
    );
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <Toaster position="top-right" />
      {/* Resto do código... */}
    </div>
  );
}

export default App;