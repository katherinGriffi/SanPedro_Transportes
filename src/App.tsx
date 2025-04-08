
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css'; 
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';

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
      toast.dismiss();
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }
  
      if (!user) {
        throw new Error('No se recibió información del usuario');
      }
      
      // Verifica el estado del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('activo, email, nombre, apellido')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw userError || new Error('Error al verificar el estado del usuario');
      }

      if (userData.activo !== true) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta no está activa. Contacta al administrador.');
      }
      
      // Limpiar caché antes de redirigir
      localStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('sb-auth-token');
      
      // Redirige después de autenticar
      navigate('/');
    } catch (error) {
      console.error('Error en login:', error);
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

// Componente para visualización de boletas de usuarios no admin
function MisBoletas({ userId }) {
  const [boletas, setBoletas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarBoletas = async () => {
      try {
        const { data, error } = await supabase
          .from('boletas_usuarios')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setBoletas(data || []);
      } catch (error) {
        console.error('Error cargando boletas:', error);
        toast.error('Error al cargar tus boletas');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      cargarBoletas();
    }
  }, [userId]);

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Mis Boletas de Pago
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : boletas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay boletas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Subida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boletas.map((boleta) => (
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
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" /> Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Componente para Gestión de Boletas (admin)
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
        .from('boletas_usuarios')  // Cambiado a la tabla correcta
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
    setIsUploading(true);
  
    try {
      // 1. Verificar permisos de admin
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        throw new Error('Solo los administradores pueden subir boletas');
      }

      // 2. Subir archivo al bucket (con nombre organizado)
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${usuarioSeleccionado}/${ano}-${mes}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('boletas-pago')  // Nombre correcto del bucket
        .upload(fileName, archivo, {
          cacheControl: '3600',
          upsert: true  // Permite sobreescribir si ya existe
        });

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('boletas-pago')
        .getPublicUrl(fileName);
        

      // 4. Registrar en la tabla de boletas
      const { error: insertError } = await supabase
        .from('boletas_usuarios')  // Tabla correcta
        .upsert({  // Usamos upsert para actualizar si ya existe
          user_id: usuarioSeleccionado,
          mes: mes,
          ano: ano,
          arquivo_url: publicUrl,
          uploaded_by: user.id
        })
        .select();

      if (insertError) throw insertError;

      toast.success("¡Boleta subida/actualizada correctamente!");
      setArchivo(null);
      await cargarBoletasUsuario();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error(error.message);
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
      // Extraer la ruta del archivo desde la URL
      const filePath = url.split('/storage/v1/object/public/boletas-pago/')[1];
      
      // Eliminar del storage
      const { error: deleteError } = await supabase.storage
        .from('boletas-pago')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Eliminar el registro de la tabla
      const { error: deleteRecordError } = await supabase
        .from('boletas_usuarios')
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


// Componente para Gestión de Días Libres
function GestionDiasLibres() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState([{ id: 'todos', nombre: 'TODOS' }]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('todos');
  const [todosDiasLibres, setTodosDiasLibres] = useState([]);
  const [modoAsignacion, setModoAsignacion] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState('');

  // Cargar sedes y usuarios al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsLoading(true);
      try {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('users')
          .select('id, email, nombre, apellido, sede, area, activo')
          .eq('activo', true)
          .neq('area', 'admin')
          .order('nombre', { ascending: true });

        if (usuariosError) throw usuariosError;

        if (usuariosData && usuariosData.length > 0) {
          setUsuarios(usuariosData);
          
          const sedesUnicas = [...new Set(usuariosData.map(u => u.sede))]
            .filter(sede => sede)
            .map(sede => ({ id: sede, nombre: sede }));
          
          setSedes(sedesUnicas);
          
          if (sedesUnicas.length > 0) {
            setSedeSeleccionada(sedesUnicas[0].id);
          }
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error al cargar datos iniciales: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Cargar días libres cuando cambia la sede o usuario seleccionado
  useEffect(() => {
    if (sedeSeleccionada) {
      cargarDiasLibresFiltrados();
    }
  }, [sedeSeleccionada, usuarioSeleccionado]);

  const cargarDiasLibresFiltrados = async () => {
    try {
      setIsLoading(true);
      
      // Obtener IDs de usuarios según los filtros
      let userIds = [];
      
      if (sedeSeleccionada === 'todos') {
        // Si se selecciona TODOS, incluir todos los usuarios activos
        userIds = usuarios.map(u => u.id);
      } else {
        // Filtrar por sede seleccionada
        userIds = usuarios
          .filter(u => u.sede === sedeSeleccionada)
          .map(u => u.id);
      }

      // Si además hay un usuario específico seleccionado, filtrar por ese usuario
      if (usuarioSeleccionado !== 'todos') {
        userIds = userIds.filter(id => id === usuarioSeleccionado);
      }

      if (userIds.length === 0) {
        setTodosDiasLibres([]);
        return;
      }

      // Consulta para obtener días libres con información de usuario
      const { data: diasData, error: diasError } = await supabase
        .from('dias_libres')
        .select(`
          *,
          users!dias_libres_user_id_fkey(id, nombre, apellido, sede, area)
        `)
        .in('user_id', userIds)
        .order('fecha', { ascending: true });

      if (diasError) throw diasError;

      setTodosDiasLibres(diasData || []);
    } catch (error) {
      console.error('Error cargando días libres:', error);
      toast.error('Error al cargar días libres: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setModoAsignacion(true);
  };

  const agregarDiaLibre = async () => {
    if (!usuarioParaAsignar || !selectedDate) {
      toast.error('Selecciona un usuario y una fecha');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar si ya existe un día libre para esta fecha y usuario
      const fechaFormateada = selectedDate.toISOString().split('T')[0];
      
      const { data: existing, error: existingError } = await supabase
        .from('dias_libres')
        .select('id')
        .eq('user_id', usuarioParaAsignar)
        .eq('fecha', fechaFormateada)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        toast.error('Este usuario ya tiene un día libre para esta fecha');
        return;
      }

      // Insertar nuevo día libre
      const { error } = await supabase
        .from('dias_libres')
        .insert([{
          user_id: usuarioParaAsignar,
          fecha: fechaFormateada,
          todo_el_dia: true
        }]);

      if (error) throw error;

      toast.success('Día libre agregado correctamente');
      await cargarDiasLibresFiltrados();
      setModoAsignacion(false);
      setUsuarioParaAsignar('');
    } catch (error) {
      console.error('Error agregando día libre:', error);
      toast.error('Error al agregar día libre: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarDiaLibre = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este día libre?')) return;

    try {
      const { error } = await supabase
        .from('dias_libres')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Día libre eliminado correctamente');
      await cargarDiasLibresFiltrados();
    } catch (error) {
      console.error('Error eliminando día libre:', error);
      toast.error('Error al eliminar día libre: ' + error.message);
    }
  };

  // Generar colores únicos para cada usuario
  const generarColorUsuario = (userId) => {
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  };

  // Preparar eventos para el calendario
  const prepararEventos = () => {
    return todosDiasLibres.map(dia => {
      const usuario = dia.users || { nombre: 'Desconocido', apellido: '' };
      return {
        id: dia.id,
        title: `${usuario.nombre} ${usuario.apellido}`,
        start: new Date(dia.fecha),
        end: new Date(dia.fecha),
        allDay: true,
        resource: dia,
        color: generarColorUsuario(dia.user_id)
      };
    });
  };

  // Estilo personalizado para eventos
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 5px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    };
  };

  // Crear leyenda de usuarios
  const crearLeyendaUsuarios = () => {
    const usuariosConDiasLibres = [...new Set(
      todosDiasLibres
        .filter(dia => dia.users)
        .map(dia => dia.users)
    )];

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {usuariosConDiasLibres.map(usuario => (
          <div key={usuario.id} className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: generarColorUsuario(usuario.id) }}
            />
            <span className="text-sm">
              {usuario.nombre} {usuario.apellido} ({usuario.sede || 'Sin sede'})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Gestión de Días Libres
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sede
              </label>
              <select
                value={sedeSeleccionada}
                onChange={(e) => setSedeSeleccionada(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                disabled={isLoading || sedes.length === 0}
              >
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

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
                <option value="todos">Todos los usuarios</option>
                {usuarios
                  .filter(u => u.sede === sedeSeleccionada)
                  .map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} {usuario.apellido}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Leyenda de usuarios */}
          {todosDiasLibres.length > 0 && crearLeyendaUsuarios()}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendario de Días Libres
            </label>
            <div className="border rounded-lg p-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <BigCalendar
                  localizer={localizer}
                  events={prepararEventos()}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  defaultView="month"
                  selectable
                  onSelectSlot={({ start }) => handleDateChange(start)}
                  onSelectEvent={(event) => {
                    if (window.confirm(`¿Eliminar día libre de ${event.title}?`)) {
                      eliminarDiaLibre(event.id);
                    }
                  }}
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    today: 'Hoy',
                    previous: 'Anterior',
                    next: 'Siguiente',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                  }}
                  components={{
                    event: ({ event }) => (
                      <div className="p-1 truncate">
                        {event.title}
                      </div>
                    )
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Instrucciones</h3>
            <p className="text-sm text-blue-700">
              1. Selecciona una sede y usuario (o "Todos")<br />
              2. Los días libres aparecen en el calendario<br />
              3. Haz clic en una fecha para asignar día libre<br />
              4. Selecciona usuario y confirma<br />
              5. Haz clic en un día existente para eliminarlo
            </p>
          </div>

          {modoAsignacion ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Asignar Día Libre</h3>
              <p className="text-lg font-semibold mb-2">
                {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Usuario
                </label>
                <select
                  value={usuarioParaAsignar}
                  onChange={(e) => setUsuarioParaAsignar(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios
                    .filter(u => u.sede === sedeSeleccionada)
                    .map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido} ({usuario.area})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={agregarDiaLibre}
                  disabled={isSubmitting || !usuarioParaAsignar}
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Asignando...' : 'Confirmar Día Libre'}
                </button>
                <button
                  onClick={() => setModoAsignacion(false)}
                  className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Resumen</h3>
              <p className="text-sm text-gray-600">
                Usuarios en la sede: {usuarios.filter(u => u.sede === sedeSeleccionada).length}<br />
                Días libres este mes: {todosDiasLibres.filter(dia => {
                  const fecha = new Date(dia.fecha);
                  const hoy = new Date();
                  return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
                }).length}
              </p>
            </div>
          )}

          {usuarioSeleccionado !== 'todos' && todosDiasLibres.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Días libres del usuario</h3>
              <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {todosDiasLibres.map(dia => (
                  <li key={dia.id} className="py-2 flex justify-between items-center">
                    <span>
                      {new Date(dia.fecha).toLocaleDateString('es-ES', { 
                        weekday: 'short',
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <button 
                      onClick={() => eliminarDiaLibre(dia.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
  const [diasLibres, setDiasLibres] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('registro');
  const [userActiveTab, setUserActiveTab] = useState('registro');

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
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          throw sessionError || new Error('No hay sesión activa');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, email, nombre, apellido')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData) {
          throw userError || new Error('Error al obtener datos del usuario');
        }

        if (!userData.activo) {
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
        buscarDiasLibres(session.user.id);
      } catch (error) {
        console.error('Error obteniendo sesión:', error);
        toast.error(error.message);
      }
    };
    getSession();
  }, []);

  const buscarDiasLibres = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('dias_libres')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: true });

      if (error) throw error;

      setDiasLibres(data || []);
    } catch (error) {
      console.error('Error cargando días libres:', error);
    }
  };

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
            Gestión Boletas
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'dias-libres' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dias-libres')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Gestión Días Libres
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
              {renderNormalUserContent()}
            </div>
          )}
          
          {activeTab === 'boletas' && (
            <div className="animate-fadeIn">
              <GestionBoletas />
            </div>
          )}
          
          {activeTab === 'dias-libres' && (
            <div className="animate-fadeIn">
              <GestionDiasLibres />
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

  const renderNormalUserContent = () => {
    return (
      <>
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              userActiveTab === 'registro' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setUserActiveTab('registro')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Registro de mis Turnos
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              userActiveTab === 'boletas' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setUserActiveTab('boletas')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Mis Boletas
          </button>
        </div>

        {userActiveTab === 'registro' ? (
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
        ) : (
          <MisBoletas userId={userId} />
        )}

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
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-sm"></div>
              <span className="text-sm text-gray-950">Día Libre</span>
            </div>
          </div>  

          <div className="overflow-x-auto">
            <BigCalendar
              localizer={localizer}
              events={[
                ...eventosCalendario,
                ...diasLibres.map(dia => ({
                  title: 'Día Libre',
                  start: new Date(dia.fecha),
                  end: new Date(dia.fecha),
                  allDay: true,
                  status: 'dia-libre'
                }))
              ]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              eventPropGetter={(event) => {
                if (event.status === 'dia-libre') {
                  return {
                    style: {
                      backgroundColor: '#6f42c1',
                      borderRadius: '4px',
                      color: 'white',
                      border: 'none',
                      padding: '2px 8px',
                      fontSize: '14px',
                    }
                  };
                }
                return estiloEvento(event);
              }}
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
                  Sistema San Pedro
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {userName || userLastName ? 
                      `Hola, ${userName} ${userLastName}` : 
                      `Bienvenido!, ${userEmail}`}
                  </span>
                  <span className="text-xs text-gray-500">{userEmail}</span>
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
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.removeItem('sb-auth-token');
                  sessionStorage.removeItem('sb-auth-token');
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdminUser() ? renderAdminContent() : renderNormalUserContent()}
      </main>
    </div>
  );
}

// Componente Principal de la Aplicación
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const cleanCache = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Desregistrar service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => {
            console.log('Unregistering service worker:', r.scope);
            return r.unregister();
          }));
    
          // Limpiar cachés
          const cacheNames = await caches.keys();
          console.log('Deleting caches:', cacheNames);
          await Promise.all(cacheNames.map(name => {
            console.log('Deleting cache:', name);
            return caches.delete(name);
          }));
    
          // Forzar recarga para asegurar que todo está limpio
          if (registrations.length > 0 || cacheNames.length > 0) {
            window.location.reload(true);
          }
        } catch (error) {
          console.error('Error cleaning cache:', error);
        }
      }
    
      // Limpiar autenticación previa
      localStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('sb-auth-token');
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    };
    
    cleanCache();

    const checkAuth = async () => {
      try {
        // Forzar una nueva sesión omitiendo caché
        const { data: { session }, error: sessionError } = await supabase.auth.getSession({
          forceRefresh: true // Esto evita usar caché de autenticación
        });
        
        if (sessionError || !session?.user) {
          setIsLoggedIn(false);
          return;
        }
    
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single()
          .throwOnError(); // Esto lanzará el error si lo hay
          
        setIsLoggedIn(!!userData?.activo);
        if (!userData?.activo) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single();
        
        if (userError || !userData?.activo) {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;