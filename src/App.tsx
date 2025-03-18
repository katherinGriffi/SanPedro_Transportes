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
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userId, setUserId] = useState(null);
  const [lastEntry, setLastEntry] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);

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

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchLastEntry();
      fetchAllEntries();
      fetchWorkspaces();
    }
  }, [isLoggedIn, userId]);

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
          }
        },
        () => {
          toast.error('No se pudo obtener su ubicación');
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
        }
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
        toast.error('No se pudo obtener su ubicación');
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
              {currentLocation && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  <span>
                    Lat: {currentLocation.latitude.toFixed(6)}, Long: {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
              )}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estado del Turno
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {isWorking && timeEntry && (
                <>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Inicio del Turno</p>
                      <p className="text-sm text-gray-600">
                        {new Date(timeEntry.start_time).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Timer className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tiempo Transcurrido</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatDuration(elapsedTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPinned className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Lugar de Trabajo</p>
                      <p className="text-sm text-gray-600">{timeEntry.workplace}</p>
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Ubicación Actual</p>
                        <p className="text-sm text-gray-600">
                          Lat: {currentLocation.latitude.toFixed(6)}<br />
                          Long: {currentLocation.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isWorking ? 'Finalizar Turno' : 'Iniciar Turno'}
            </h2>
            
            {!isWorking ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar de Trabajo
                  </label>
                  <select
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                  >
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.name}>
                        {workspace.name}
                      </option>
                    ))}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                {workplace === 'Otro' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingrese el lugar de trabajo manualmente
                    </label>
                    <input
                      type="text"
                      value={customWorkplace}
                      onChange={(e) => setCustomWorkplace(e.target.value)}
                      placeholder="Ingrese el lugar de trabajo"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                    />
                  </div>
                )}
                
                <button
                  onClick={handleStartWork}
                  className="w-full bg-blue-600 text-white p-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <Clock className="w-5 h-5" />
                  <span>Iniciar Turno</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Turno en progreso</span>
                  </div>
                  <p className="mt-1 text-sm text-yellow-700">
                    Asegúrese de finalizar su turno antes de salir.
                  </p>
                </div>
                
                <button
                  onClick={handleEndWork}
                  className="w-full bg-red-600 text-white p-4 rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <Clock className="w-5 h-5" />
                  <span>Finalizar Turno</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Último Registro Pendiente */}
        {lastEntry && !isWorking && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Último Registro Pendiente
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Inicio del Turno</p>
                  <p className="text-sm text-gray-600">
                    {new Date(lastEntry.start_time).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinned className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Lugar de Trabajo</p>
                  <p className="text-sm text-gray-600">{lastEntry.workplace}</p>
                </div>
              </div>
              <button
                onClick={handleEndWork}
                className="w-full bg-red-600 text-white p-4 rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <Clock className="w-5 h-5" />
                <span>Finalizar Turno Pendiente</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Registros */}
        {allEntries.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Historial de Registros (Últimos 7)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora de Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora de Finalización
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lugar de Trabajo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordenadas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.start_time).toLocaleString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.end_time ? new Date(entry.end_time).toLocaleString('es-ES') : 'En progreso'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.workplace}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Lat: {entry.start_latitude?.toFixed(6)}, Long: {entry.start_longitude?.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;