import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuración del calendario
const localizer = momentLocalizer(moment);
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_')
});

// Función para formatar duración
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Componente de Login
function IniciarSesion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) {
        throw authError || new Error('Credenciales inválidas');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('activo, nombre, apellido')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Error al verificar el estado del usuario');
      }

      if (userData.activo !== true) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta no está activa. Contacta al administrador.');
      }

      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
        </form>
      </div>
    </div>
  );
}

// Componente para Gestión de Boletas
function GestionBoletas() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [archivo, setArchivo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [boletasExistentes, setBoletasExistentes] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const cargarUsuarios = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, nombre, apellido')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setUsuarios(data);
          setUsuarioSeleccionado(data[0].id);
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (usuarioSeleccionado) {
      cargarBoletasUsuario();
    }
  }, [usuarioSeleccionado]);

  const cargarBoletasUsuario = async () => {
    try {
      const { data, error } = await supabase
        .from('boletas_pagos')
        .select('*')
        .eq('user_id', usuarioSeleccionado)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBoletasExistentes(data || []);
    } catch (error) {
      console.error('Error cargando boletas:', error);
      toast.error('Error al cargar boletas: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuarioSeleccionado || !archivo) {
      toast.error('Selecciona un usuario y un archivo');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${usuarioSeleccionado}_${ano}_${mes}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('boletas')
        .upload(filePath, archivo);

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          const { error: updateError } = await supabase.storage
            .from('boletas')
            .update(filePath, archivo);
          
          if (updateError) throw updateError;
        } else {
          throw uploadError;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('boletas')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('boletas_pagos')
        .upsert(
          {
            user_id: usuarioSeleccionado,
            arquivo_url: publicUrl,
            ano: ano,
            mes: mes
          },
          { onConflict: ['user_id', 'ano', 'mes'] }
        );

      if (insertError) throw insertError;

      toast.success('Boleta subida correctamente');
      setArchivo(null);
      await cargarBoletasUsuario();
    } catch (error) {
      console.error('Error subiendo boleta:', error);
      toast.error('Error al subir la boleta: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm('¿Estás seguro de eliminar esta boleta?')) return;

    try {
      const filePath = url.split('/storage/v1/object/public/boletas/')[1];
      
      const { error: deleteError } = await supabase.storage
        .from('boletas')
        .remove([filePath]);

      if (deleteError && !deleteError.message.includes('not found')) {
        throw deleteError;
      }

      const { error: deleteRecordError } = await supabase
        .from('boletas_pagos')
        .delete()
        .eq('id', id);

      if (deleteRecordError) throw deleteRecordError;

      toast.success('Boleta eliminada correctamente');
      await cargarBoletasUsuario();
    } catch (error) {
      console.error('Error eliminando boleta:', error);
      toast.error('Error al eliminar la boleta: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Gestión de Boletas de Pago
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              disabled={isLoading}
            >
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              min="2000"
              max="2100"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archivo de Boleta (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || !archivo}
          className="mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mr-2" />
          {isUploading ? 'Subiendo...' : 'Subir Boleta'}
        </button>
      </form>

      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">
          Boletas existentes para este usuario
        </h3>
        
        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : boletasExistentes.length === 0 ? (
          <p className="text-sm text-gray-500">No hay boletas registradas para este usuario.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Subida</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boletasExistentes.map((boleta) => (
                  <tr key={boleta.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{boleta.ano}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(2000, boleta.mes - 1, 1).toLocaleString('es-ES', { month: 'long' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(boleta.created_at).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDownload(boleta.arquivo_url)}
                        className="text-blue-600 hover:text-blue-900 mr-4 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" /> Descargar
                      </button>
                      <button
                        onClick={() => handleDelete(boleta.id, boleta.arquivo_url)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Principal
function PaginaPrincipal() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');
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
  const [activeTab, setActiveTab] = useState('registro');

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
      console.log('Sesión obtenida:', session); // Depuración
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('activo, email, nombre, apellido')
          .eq('id', session.user.id)
          .single();
          console.log('Datos del usuario:', userData); // Depuración
          console.log('Error al obtener usuario:', error); // Depuración

        if (!userData?.activo) {
          await supabase.auth.signOut();
          window.location.reload();
          return;
        }

        setUserId(session.user.id);
        setUserEmail(userData.email);
        setUserName(userData.nombre || '');
        setUserLastName(userData.apellido || '');
        buscarUltimoRegistro(session.user.id);
        buscarTodosRegistros(session.user.id);
        buscarLugaresTrabajo();
      }
    };
    getSession();
  }, []);

  const isAdminUser = () => {
    if (!userEmail) return false;
    
    const adminEmails = [
      'admin_oficinas@sanpedrocargo.com',
      'admin_ruta@sanpedrocargo.com',
      'gina_yurivilca@transportessanpedro.com',
      'judith_yurivilca@transportessanpedro.com'
    ].map(email => email.toLowerCase());
  
    return adminEmails.includes(userEmail.toLowerCase());
  };

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
        const eventos = data.map(registro => ({
          title: registro.workplace,
          start: new Date(registro.start_time),
          end: registro.end_time ? new Date(registro.end_time) : new Date(),
          status: registro.end_time ? 'completado' : 'en progreso',
        }));
        setEventosCalendario(eventos);
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

  const renderAdminContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'registro' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('registro')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Registro
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'boletas' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('boletas')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Boletas
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'dashboard' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </button>
        </div>

        <div className="transition-all duration-200">
          {activeTab === 'registro' && (
            <div className="animate-fadeIn">
              {renderNormalContent()}
            </div>
          )}
          
          {activeTab === 'boletas' && (
            <div className="animate-fadeIn">
              <GestionBoletas />
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-lg shadow p-4">
                <iframe 
                  title="Dashboard Power BI"
                  width="100%" 
                  height="700"
                  src="https://app.powerbi.com/view?r=eyJrIjoiOTEwODdmMmYtM2FjZC00ZDUyLWI1MjctM2IwYTVjM2RiMTNiIiwidCI6IjljNzI4NmYyLTg0OTUtNDgzZi1hMTc4LTQwMjZmOWU0ZTM2MiIsImMiOjR9" 
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNormalContent = () => (
    <>
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
            events={eventosCalendario}
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
    </>
  );

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
                <div className="flex flex-col">
                  <span className="font-medium">
                  {userName || userLastName ? (
                  `Hola ${userName} ${userLastName}!`
                   ) : (
                   'Bienvenido!'
                   )}
                  </span>
                  
                </div>
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
        {isAdminUser() ? renderAdminContent() : renderNormalContent()}
      </main>
    </div>
  );
}

// Componente Principal de la Aplicación
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single();
        
        if (!userData?.activo) {
          await supabase.auth.signOut();
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single();
        
        if (!userData?.activo) {
          await supabase.auth.signOut();
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={isLoggedIn ? <PaginaPrincipal /> : <IniciarSesion />} />
      </Routes>
    </Router>
  );
}

export default App;