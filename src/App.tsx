import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuración de moment para el calendario
const localizer = momentLocalizer(moment);
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_')
});

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function ActualizarContraseña() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          toast.error('Enlace de recuperación inválido o expirado');
          navigate('/');
          return;
        }
        
        // Verificar que el usuario está autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          toast.error('No se pudo verificar el usuario');
          navigate('/');
          return;
        }
        
        setSessionVerified(true);
      } else {
        toast.error('Enlace de recuperación inválido');
        navigate('/');
      }
    };

    verifySession();
  }, [navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!sessionVerified) {
      toast.error('Sesión no verificada');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      toast.success('¡Contraseña actualizada con éxito!');
      
      // Cerrar sesión después de actualizar la contraseña
      await supabase.auth.signOut();
      
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Volver al inicio
        </button>
        
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Actualizar Contraseña
        </h1>
        
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nueva Contraseña (mínimo 6 caracteres)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

function IniciarSesion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
// eliminar 

  useEffect(() => {
    alert(`Entorno: ${import.meta.env.MODE}\nMostrar enlace: ${!showForgotPassword}`);
  }, [showForgotPassword]);
//

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) {
        throw error || new Error('Error al iniciar sesión');
      }

      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Usuario o contraseña inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'https://katheringriffi.github.io/SanPedro_Transportes/#/actualizar-contrasena',
      });

      if (error) throw error;

      setResetSent(true);
      toast.success('Se ha enviado un enlace de recuperación a tu correo');
    } catch (error) {
      toast.error(error.message || 'Error al enviar el email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };
  console.log("Renderizando IniciarSesion. showForgotPassword:", showForgotPassword);


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-center mb-8">
          <Truck className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Transportes San Pedro
        </h1>
        
        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de recuperación
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Ingresa tu email"
                required
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            
            {resetSent && (
              <div className="text-center text-sm text-green-600 mt-2">
                Se ha enviado un enlace a tu correo. Revisa tu bandeja de entrada.
              </div>
            )}
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ color: '#2563eb', textDecoration: 'underline' }} // Equivalente a text-blue-600 y underline
                className="text-sm hover:text-blue-800"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PaginaPrincipal() {
  const [lugarTrabajo, setLugarTrabajo] = useState('');
  const [lugarPersonalizado, setLugarPersonalizado] = useState('');
  const [registroTiempo, setRegistroTiempo] = useState(null);
  const [estaTrabajando, setEstaTrabajando] = useState(false);
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [userId, setUserId] = useState(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [todosRegistros, setTodosRegistros] = useState([]);
  const [lugaresTrabajo, setLugaresTrabajo] = useState([]);
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (estaTrabajando && registroTiempo) {
      interval = setInterval(() => {
        setTiempoTranscurrido(new Date().getTime() - new Date(registroTiempo.start_time).getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [estaTrabajando, registroTiempo]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual(position.coords);
        },
        () => {
          toast.error('No se pudo obtener tu ubicación');
        }
      );
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        buscarUltimoRegistro(session.user.id);
        buscarTodosRegistros(session.user.id);
        buscarLugaresTrabajo();
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    if (todosRegistros.length > 0) {
      const eventos = todosRegistros.map(registro => ({
        title: registro.workplace,
        start: new Date(registro.start_time),
        end: registro.end_time ? new Date(registro.end_time) : new Date(),
        allDay: false,
      }));
      setEventosCalendario(eventos);
    }
  }, [todosRegistros]);

  const buscarLugaresTrabajo = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;

      setLugaresTrabajo(data);
      if (data.length > 0) {
        setLugarTrabajo(data[0].name);
      }
    } catch (error) {
      console.error('Error buscando lugares de trabajo:', error);
      toast.error('Error cargando lugares de trabajo');
    }
  };

  const buscarUltimoRegistro = async (userId) => {
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
        setUltimoRegistro(data);
        setRegistroTiempo(data);
        setEstaTrabajando(true);
        toast('¡Tienes un turno abierto!', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error buscando último registro:', error);
    }
  };

  const buscarTodosRegistros = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      if (data) {
        setTodosRegistros(data);
      }
    } catch (error) {
      console.error('Error buscando todos los registros:', error);
    }
  };

  const iniciarTurno = async () => {
    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (estaProcesando) return;
    setEstaProcesando(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lugarSeleccionado = lugarTrabajo === 'Otro' ? lugarPersonalizado : lugarTrabajo;

            const nuevoRegistro = {
              user_id: userId,
              workplace: lugarSeleccionado,
              start_time: new Date().toISOString(),
              start_latitude: position.coords.latitude,
              start_longitude: position.coords.longitude,
            };

            const { data: registro, error } = await supabase
              .from('time_entries')
              .insert([nuevoRegistro])
              .select()
              .single();

            if (error) throw error;

            setRegistroTiempo(registro);
            setEstaTrabajando(true);
            setUbicacionActual(position.coords);
            localStorage.setItem('registroTiempo', JSON.stringify(registro));
            toast.success('¡Turno iniciado!');
            buscarTodosRegistros(userId);
          } catch (error) {
            console.error('Error iniciando turno:', error);
            toast.error('Error al iniciar el turno');
          } finally {
            setEstaProcesando(false);
          }
        },
        () => {
          toast.error('No se pudo obtener tu ubicación');
          setEstaProcesando(false);
        }
      );
    }
  };

  const finalizarTurno = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada');
      return;
    }

    if (!registroTiempo?.id) {
      toast.error('No se encontró un turno activo');
      return;
    }

    if (estaProcesando) return;
    setEstaProcesando(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const actualizaciones = {
            end_time: new Date().toISOString(),
            end_latitude: position.coords.latitude,
            end_longitude: position.coords.longitude,
          };

          const { data: registroActualizado, error } = await supabase
            .from('time_entries')
            .update(actualizaciones)
            .eq('id', registroTiempo.id)
            .select()
            .single();

          if (error) throw error;

          const tiempoTotal = formatDuration(new Date(actualizaciones.end_time).getTime() - new Date(registroTiempo.start_time).getTime());
          toast.success(`¡Turno finalizado! Tiempo trabajado: ${tiempoTotal}`);

          setRegistroTiempo(null);
          setEstaTrabajando(false);
          setTiempoTranscurrido(0);
          setUbicacionActual(null);
          localStorage.removeItem('registroTiempo');
          setUltimoRegistro(null);
          buscarTodosRegistros(userId);
        } catch (error) {
          console.error('Error finalizando turno:', error);
          toast.error('Error al finalizar el turno');
        } finally {
          setEstaProcesando(false);
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        toast.error('No se pudo obtener tu ubicación');
        setEstaProcesando(false);
      }
    );
  };

  const estiloEvento = (evento) => {
    let colorFondo = '#3174ad';
    if (evento.status === 'completado') {
      colorFondo = '#28a745';
    } else if (evento.status === 'en progreso') {
      colorFondo = '#ffc107';
    } else {
      colorFondo = '#dc3545';
    }
    return {
      style: {
        backgroundColor: colorFondo,
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        padding: '2px 8px',
        fontSize: '14px',
      },
    };
  };

  const generarEventosCalendario = () => {
    return todosRegistros.map(registro => ({
      title: registro.workplace,
      start: new Date(registro.start_time),
      end: registro.end_time ? new Date(registro.end_time) : new Date(),
      status: registro.end_time ? 'completado' : 'en progreso',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <Toaster position="top-right" />
      
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-blue-800" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Transportes San Pedro
                </h1>
                <p className="text-sm text-gray-500">
                  Sistema de Registro de Tiempos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span>{userId}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span>{currentTime.toLocaleTimeString('es-ES')}</span>
              </div>
              {ubicacionActual && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  <span>
                    Lat: {ubicacionActual.latitude.toFixed(6)}, Long: {ubicacionActual.longitude.toFixed(6)}
                  </span>
                </div>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
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
              
              {estaTrabajando && registroTiempo && (
                <>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Inicio del Turno</p>
                      <p className="text-sm text-gray-600">
                        {new Date(registroTiempo.start_time).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Timer className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tiempo Transcurrido</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatDuration(tiempoTranscurrido)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPinned className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Lugar de Trabajo</p>
                      <p className="text-sm text-gray-600">{registroTiempo.workplace}</p>
                    </div>
                  </div>

                  {ubicacionActual && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Ubicación Actual</p>
                        <p className="text-sm text-gray-600">
                          Lat: {ubicacionActual.latitude.toFixed(6)}<br />
                          Long: {ubicacionActual.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {estaTrabajando ? 'Finalizar Turno' : 'Iniciar Turno'}
            </h2>
            
            {!estaTrabajando ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar de Trabajo
                  </label>
                  <select
                    value={lugarTrabajo}
                    onChange={(e) => setLugarTrabajo(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                  >
                    {lugaresTrabajo.map((lugar) => (
                      <option key={lugar.id} value={lugar.name}>
                        {lugar.name}
                      </option>
                    ))}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                {lugarTrabajo === 'Otro' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especificar lugar de trabajo
                    </label>
                    <input
                      type="text"
                      value={lugarPersonalizado}
                      onChange={(e) => setLugarPersonalizado(e.target.value)}
                      placeholder="Ingresa el lugar de trabajo"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                    />
                  </div>
                )}
                
                <button
                  onClick={iniciarTurno}
                  disabled={estaProcesando}
                  className="w-full bg-blue-600 text-white p-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50"
                >
                  <Clock className="w-5 h-5" />
                  <span>{estaProcesando ? 'Procesando...' : 'Iniciar Turno'}</span>
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
                    Asegúrate de finalizar tu turno antes de salir.
                  </p>
                </div>
                
                <button
                  onClick={finalizarTurno}
                  disabled={estaProcesando}
                  className="w-full bg-red-600 text-white p-4 rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50"
                >
                  <Clock className="w-5 h-5" />
                  <span>{estaProcesando ? 'Procesando...' : 'Finalizar Turno'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Calendario de Trabajo
          </h2>

          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
              <span className="text-sm text-gray-950">Turno Completado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[#ffc107] rounded-sm"></div>
              <span className="text-sm text-gray-950">Turno en Progreso</span>
            </div>
          </div>  

          <div className="overflow-x-auto">
            <BigCalendar
              localizer={localizer}
              events={generarEventosCalendario()}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              eventPropGetter={estiloEvento}
              defaultView="month"
              messages={{
                today: 'Hoy',
                previous: 'Anterior',
                next: 'Siguiente',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Cambio de estado de sesión:", event, "Sesión:", !!session);
      setIsLoggedIn(!!session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <PaginaPrincipal /> : <IniciarSesion />} />
        <Route path="/actualizar-contrasena" element={<ActualizarContraseña />} />
      </Routes>
    </Router>
  );
}

export default App;