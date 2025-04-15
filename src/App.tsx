import React, { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, FileText, Upload, Download } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';

// Componente para seleccionar el router adecuado
const AppRouter = ({ children }: { children: React.ReactNode }) => {
  return import.meta.env.PROD ? (
    <HashRouter>{children}</HashRouter>
  ) : (
    <BrowserRouter>{children}</BrowserRouter>
  );
};

// Configuración del calendario
const localizer = momentLocalizer(moment);
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_')
});

// Función para limpiar la caché de autenticación
const clearAuthCache = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_URL}-auth-token`);
    sessionStorage.removeItem('sb-auth-token');
    sessionStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_URL}-auth-token`);
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
};

function formatDuration(milliseconds: number) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // Limpiar caché existente
      await supabase.auth.signOut();
      localStorage.removeItem('sb-auth-token');
      
      // Forzar nuevo login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) throw error;
      if (!data?.session) throw new Error('No session created');
  
      // Redirigir con recarga completa para asegurar estado limpio
      window.location.href = '/';
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

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

    if (userId) cargarBoletas();
  }, [userId]);

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Mis Boletas de Pago 
      </h2>
      <h4 className="text-lg font-semibold text-red-900 mb-10">           
        
      ¡Muy pronto podrás acceder a tus boletas de pago aquí! 🚀
      </h4>

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
    if (usuarioSeleccionado) cargarBoletasUsuario();
  }, [usuarioSeleccionado]);

  const cargarBoletasUsuario = async () => {
    try {
      const { data, error } = await supabase
        .from('boletas_usuarios')
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
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        throw new Error('Solo los administradores pueden subir boletas');
      }

      const fileExt = archivo.name.split('.').pop();
      const fileName = `${usuarioSeleccionado}/${ano}-${mes}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('boletas-pago')
        .upload(fileName, archivo, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('boletas-pago')
        .getPublicUrl(fileName);
        
      const { error: insertError } = await supabase
        .from('boletas_usuarios')
        .upsert({
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
      const filePath = url.split('/storage/v1/object/public/boletas-pago/')[1];
      
      const { error: deleteError } = await supabase.storage
        .from('boletas-pago')
        .remove([filePath]);

      if (deleteError) throw deleteError;

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

function GestionDiasLibres() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState([{ id: 'todos', nombre: 'TODOS' }]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState('todos');
  const [todosDiasLibres, setTodosDiasLibres] = useState([]);
  const [modoAsignacion, setModoAsignacion] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsLoading(true);
      try {
        // 1. Cargar todos los usuarios activos
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('users')
          .select('id, nombre, apellido, sede, area')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (usuariosError) throw usuariosError;

        if (usuariosData) {
          setUsuarios(usuariosData);
          
          // Obtener sedes únicas para el filtro
          const sedesUnicas = [...new Set(usuariosData.map(u => u.sede))]
            .filter(sede => sede)
            .map(sede => ({ id: sede, nombre: sede }));
          
          setSedes([{ id: 'todos', nombre: 'TODOS' }, ...sedesUnicas]);
        }

        // 2. Cargar todos los días libres con información de usuarios
        await cargarTodosDiasLibres();
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error al cargar datos iniciales: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Cargar días libres cuando cambia la sede seleccionada
  useEffect(() => {
    if (sedeSeleccionada) {
      cargarTodosDiasLibres();
    }
  }, [sedeSeleccionada]);

  // Función para cargar todos los días libres con información de usuarios
  const cargarTodosDiasLibres = async () => {
  try {
    setIsLoading(true);

    // Obtener el usuario autenticado y su rol
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuario no autenticado');

    // Obtener el rol del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    const userRole = userData?.role || 'user';

    // Construir la consulta base con el join correcto
    let query = supabase
      .from('dias_libres')
      .select(`
        id,
        user_id,
        fecha,
        todo_el_dia,
        users!inner(id, nombre, apellido, sede, area)
      `);

    // Solo filtrar por user_id si NO es admin
    if (userRole !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    // Aplicar filtro por sede si no es "todos"
    if (sedeSeleccionada !== 'todos') {
      query = query.eq('users.sede', sedeSeleccionada);
    }

    // Ejecutar la consulta ordenada por fecha
    const { data: diasData, error: diasError } = await query
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
  
  
  
  
  // Generar color único para cada usuario
  const generarColorUsuario = (userId) => {
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  };

  // Preparar eventos para el calendario
  const prepararEventos = () => {
    return todosDiasLibres.map(dia => {
      const usuario = dia.users || { nombre: 'Desconocido', apellido: '', sede: 'Sin sede' };
      return {
        id: dia.id,
        title: `${usuario.nombre} ${usuario.apellido} (${usuario.sede})`,
        start: new Date(dia.fecha),
        end: new Date(dia.fecha),
        allDay: true,
        resource: dia,
        color: generarColorUsuario(dia.user_id),
        className: 'evento-dia-libre'
      };
    });
  };

  // Estilo para los eventos del calendario
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

  // Crear leyenda de usuarios con sus colores
  const crearLeyendaUsuarios = () => {
    // Obtener usuarios únicos que tienen días libres
    const usuariosUnicos = [...new Map(
      todosDiasLibres
        .filter(dia => dia.users)
        .map(dia => [dia.users.id, dia.users])
    ).values()];

    return (
      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        {usuariosUnicos.map(usuario => (
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

  // Manejar selección de fecha para asignar día libre
  const handleDateChange = (date) => {
  // Ajustar la fecha para evitar problemas de zona horaria
  const adjustedDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );
  setSelectedDate(adjustedDate);
  setModoAsignacion(true);
};

  // Agregar nuevo día libre
  const agregarDiaLibre = async () => {
    if (!usuarioParaAsignar || !selectedDate) {
      toast.error('Selecciona un usuario y una fecha');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      // Crear fecha sin componente de hora y sin ajuste de zona horaria
      const fechaFormateada = new Date(
        Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
      ).toISOString().split('T')[0];
      
      // Verificar si ya existe un día libre para este usuario en esta fecha
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
  
      // Crear nuevo día libre
      const { error } = await supabase
        .from('dias_libres')
        .insert([{
          user_id: usuarioParaAsignar,
          fecha: fechaFormateada,
          todo_el_dia: true
        }]);
  
      if (error) throw error;
  
      toast.success('Día libre agregado correctamente');
      await cargarTodosDiasLibres();
      setModoAsignacion(false);
      setUsuarioParaAsignar('');
    } catch (error) {
      console.error('Error agregando día libre:', error);
      toast.error('Error al agregar día libre: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar día libre
  const eliminarDiaLibre = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este día libre?')) return;

    try {
      const { error } = await supabase
        .from('dias_libres')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Día libre eliminado correctamente');
      await cargarTodosDiasLibres();
    } catch (error) {
      console.error('Error eliminando día libre:', error);
      toast.error('Error al eliminar día libre: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Gestión de Días Libres
      </h2>

      <div className="grid gap-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Sede
            </label>
            <select
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              disabled={isLoading}
            >
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leyenda de usuarios */}
        {todosDiasLibres.length > 0 && crearLeyendaUsuarios()}

        {/* Calendario */}
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
              />
            )}
          </div>
        </div>

        {/* Formulario para asignar día libre */}
        {modoAsignacion && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-800 mb-2">Asignar Día Libre</h3>
            <p className="text-lg font-semibold mb-2">
              {selectedDate.toLocaleDateString('es-ES', { 
                timeZone: 'UTC',
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
                  .filter(u => sedeSeleccionada === 'todos' || u.sede === sedeSeleccionada)
                  .map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} {usuario.apellido} ({usuario.sede || 'Sin sede'})
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
        )}

        {/* Resumen estadístico */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Resumen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Total Usuarios</p>
              <p className="text-xl font-bold">
                {usuarios.filter(u => sedeSeleccionada === 'todos' || u.sede === sedeSeleccionada).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-green-800">Días libres este mes</p>
              <p className="text-xl font-bold">
                {todosDiasLibres.filter(dia => {
                  const fecha = new Date(dia.fecha);
                  const hoy = new Date();
                  return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-purple-800">Días libres totales</p>
              <p className="text-xl font-bold">{todosDiasLibres.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MisDatos({ userData }) {
  if (!userData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Mis Datos Personales
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-900">{userData.nombre || 'No especificado'}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-900">{userData.apellido || 'No especificado'}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sede Principal</label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-900">{userData.sede || 'No especificado'}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-900">{userData.area || 'No especificado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [userData, setUserData] = useState(null);
  const [gpsDisabled, setGpsDisabled] = useState(false);

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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession({
          forceRefresh: true
        });
        
        if (sessionError || !session?.user) {
          throw sessionError || new Error('No hay sesión activa');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, nombre, apellido, sede, area, activo')
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
        setUserData(userData); 
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

  const handleActivarGPS = () => {
    // Intentar abrir configuración de ubicación en dispositivos móviles
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Dispositivos móviles
      window.location.href = 'app-settings:location'; // Intenta abrir configuración (soporte varía por dispositivo)
    } else {
      // Navegadores de escritorio
      if (navigator.permissions) {
        // Navegadores que soportan la API de permisos
        navigator.permissions.query({name: 'geolocation'}).then(permissionStatus => {
          if (permissionStatus.state === 'prompt') {
            // Solicitar permisos directamente
            navigator.geolocation.getCurrentPosition(
              () => toast.success('Permisos concedidos'),
              () => toast.error('Permisos denegados'),
              { maximumAge: 0 }
            );
          } else if (permissionStatus.state === 'denied') {
            // Guiar al usuario a ajustes del navegador
            toast(
              <div>
                <p>Debes habilitar manualmente los permisos de ubicación en:</p>
                <p className="font-bold">Ajustes del navegador → Privacidad y seguridad → Configuración de ubicación</p>
              </div>,
              { duration: 6000 }
            );
          }
        });
      } else {
        // Navegadores más antiguos
        toast(
          <div>
            <p>Por favor habilita manualmente el GPS y los permisos de ubicación en:</p>
            <p className="font-bold">Configuración de tu dispositivo → Ubicación</p>
          </div>,
          { duration: 6000 }
        );
      }
    }
    
    // Volver a intentar obtener ubicación
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacionActual(position.coords);
        setGpsDisabled(false);
      },
      () => setGpsDisabled(true)
    );
  };



  
  
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

  const isAdminUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
  
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
  
      if (error) throw error;
      
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error verificando rol de admin:', error);
      return false;
    }
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
    
    const obtenerUbicacion = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setGpsDisabled(true);
          toast.error('Tu navegador no soporta geolocalización');
          resolve(null);
          return;
        }
    
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGpsDisabled(false);
            setUbicacionActual(position.coords);
            resolve(position.coords);
          },
          (error) => {
            setGpsDisabled(true);
            let errorMessage = 'Error al obtener ubicación';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Permisos de ubicación denegados';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Información de ubicación no disponible';
                break;
              case error.TIMEOUT:
                errorMessage = 'Tiempo de espera agotado';
                break;
            }
            
            toast.error(errorMessage);
            resolve(null);
          },
          { 
            timeout: 10000,
            maximumAge: 0,
            enableHighAccuracy: true 
          }
        );
      });
    };
  
    try {
      const coords = await obtenerUbicacion();
      const lugarSeleccionado = lugarTrabajo === 'Otro' ? lugarPersonalizado : lugarTrabajo;
  
      const nuevoRegistro = {
        user_id: userId,
        workplace: lugarSeleccionado,
        start_time: new Date().toISOString(),
        start_latitude: coords?.latitude || null,
        start_longitude: coords?.longitude || null,
      };
  
      const { data: registro, error } = await supabase
        .from('time_entries')
        .insert([nuevoRegistro])
        .select()
        .single();
  
      if (error) throw error;
  
      setRegistroTiempo(registro);
      setEstaTrabajando(true);
      setUbicacionActual(coords);
      toast.success('¡Turno iniciado!');
      buscarTodosRegistros(userId);
    } catch (error) {
      console.error('Error iniciando turno:', error);
      toast.error('Error al iniciar el turno');
    } finally {
      setEstaProcesando(false);
    }
  };

  const finalizarTurno = async () => {
    if (!registroTiempo?.id) {
      toast.error('No se encontró un turno activo');
      return;
    }
  
    if (estaProcesando) return;
    setEstaProcesando(true);

    
  
    const obtenerUbicacion = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setGpsDisabled(true);
          resolve(null);
          return;
        }
    
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGpsDisabled(false);
            resolve(position.coords);
          },
          () => {
            setGpsDisabled(true);
            resolve(null);
          },
          { timeout: 5000 }
        );
      });
    };
  
    try {
      const coords = await obtenerUbicacion();
      const actualizaciones = {
        end_time: new Date().toISOString(),
        end_latitude: coords?.latitude || null,
        end_longitude: coords?.longitude || null,
      };
  
      const { data: registroActualizado, error } = await supabase
        .from('time_entries')
        .update(actualizaciones)
        .eq('id', registroTiempo.id)
        .select()
        .single();
  
      if (error) throw error;
  
      const tiempoTotal = formatDuration(
        new Date(actualizaciones.end_time).getTime() - 
        new Date(registroTiempo.start_time).getTime()
      );
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const checkAdminStatus = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setIsAdmin(false);
            return;
          }
  
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
  
          if (error) throw error;
          setIsAdmin(userData?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      };
  
      checkAdminStatus();
    }, []);
  
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
  
    return (
      <div className="flex">
        {/* Barra lateral - Solo visible para admin */}
        {isAdmin && (
          <div className="w-64 bg-gray-100 p-4">
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center w-full mb-4 ${
                activeTab === 'registro'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('registro')}
            >
              <Truck className="w-4 h-4 mr-2" />
              General
            </button>
            
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center w-full mb-4 ${
                activeTab === 'boletas'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('boletas')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Gestión Boletas
            </button>
            
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center w-full mb-4 ${
                activeTab === 'dias-libres'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('dias-libres')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Gestión Días Libres
            </button>
            
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center w-full mb-4 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
          </div>
        )}
  
        {/* Contenido principal */}
        <div className={`${isAdmin ? 'flex-1' : 'w-full'} p-6`}>
          <div className="transition-all duration-200">
            {(!isAdmin || activeTab === 'registro') && renderNormalUserContent()}
            
            {isAdmin && activeTab === 'boletas' && (
              <div className="animate-fadeIn">
                <GestionBoletas />
              </div>
            )}
            
            {isAdmin && activeTab === 'dias-libres' && (
              <div className="animate-fadeIn">
                <GestionDiasLibres />
              </div>
            )}
  
            {isAdmin && activeTab === 'dashboard' && (
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
      </div>
    );
  };
  
  
  const renderNormalUserContent = () => {
    return (
      <>
        <div className="flex border-b border-gray-200 mb-6">
          {/* Pestañas */}
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
          {/* Pestaña MIS DATOS */}
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              userActiveTab === 'mis-datos' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            
            onClick={() => setUserActiveTab('mis-datos')}
          >
            <User className="w-4 h-4 mr-2" />
            Mis Datos
            
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
            Mis Boletas de Pago
          </button>
        </div>

        {userActiveTab === 'registro' && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado del Turno
                </h2>

                {gpsDisabled && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Para un registro completo, active su GPS y conceda permisos de ubicación.
                        <button 
                          onClick={handleActivarGPS}
                          className="ml-2 text-yellow-700 hover:text-yellow-600 font-medium underline"
                        >
                          Activar ahora
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                          day: 'numeric',
                          timeZone: 'UTC' 
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
                <Clock className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Tiempo Transcurrido</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatDuration(tiempoTranscurrido)}
                  </p>
                </div>
              </div>

                      

                      {ubicacionActual && (
                        <div className="flex items-start space-x-3">
                        <MapPin className={`w-5 h-5 mt-1 ${ubicacionActual ? 'text-green-500' : 'text-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ubicación Actual</p>
                          {ubicacionActual ? (
                            <p className="text-sm text-gray-600">
                              Lat: {ubicacionActual.latitude.toFixed(6)}<br />
                              Long: {ubicacionActual.longitude.toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600">
                              No disponible<br />
                              <button 
                                onClick={handleActivarGPS}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                Activar GPS
                              </button>
                            </p>
                          )}
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
                  <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
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
        )}

        {userActiveTab === 'mis-datos' && (
          <MisDatos userData={userData} />
        )}

        {userActiveTab === 'boletas' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <MisBoletas userId={userId} />
          </div>
        )}
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
      {renderAdminContent()}
    </main>
    </div>
  );
}

// Componente principal de la aplicación
function App() {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Forzar refresco de sesión
        const { data: { session }, error } = await supabase.auth.getSession({
          forceRefresh: true
        });

        if (error || !session) {
          throw new Error(error?.message || 'No active session');
        }

        // 2. Verificar usuario en la base de datos
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError || !user?.activo) {
          await supabase.auth.signOut();
          throw new Error(userError?.message || 'User not active');
        }

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user
        });
      } catch (error) {
        console.log('Auth check error:', error instanceof Error ? error.message : 'Error desconocido');
        await supabase.auth.signOut();
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null
        });
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkAuth();
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={
            authState.isAuthenticated ? (
              <PaginaPrincipal user={authState.user} />
            ) : (
              <IniciarSesion />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppRouter>
  );
}

export default App;



