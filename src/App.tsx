import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css'; 
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download, Table2Icon, Table, PanelsTopLeft, PersonStanding, PersonStandingIcon , Eye, EyeOff} from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Event } from 'react-big-calendar';
import {  Chart as ChartJS,  ArcElement,   Tooltip,  Legend} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Configuración del calendario
const localizer = momentLocalizer(moment);
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_')
});

function formatDuration(milliseconds:number) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


function IniciarSesion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
  
    console.log('Iniciando sesión...');

    try {
      toast.dismiss();
      console.log(`Autenticando al usuario con email: ${email}`);

      // 1. Autenticación con Supabase
      const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Error de autenticación:', authError);
        throw authError;
      }

      if (!user || !session) {
        throw new Error('No se recibió información del usuario o sesión');
      }

      console.log('Usuario autenticado:', user.id);

      // 2. Verificar estado del usuario en la tabla users
      console.log('Consultando datos del usuario...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('activo, email, nombre, apellido')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error al obtener datos del usuario:', userError);
        throw userError;
      }

      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      if (userData.activo !== true) {
        console.log('Usuario no activo. Cerrando sesión...');
        await supabase.auth.signOut();
        throw new Error('Tu cuenta no está activa. Contacta al administrador.');
      }

      // 3. Almacenar datos importantes
      localStorage.setItem('sb-access-token', session.access_token);
      localStorage.setItem('sb-refresh-token', session.refresh_token);
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        nombre: userData.nombre,
        apellido: userData.apellido
      }));

      console.log('Inicio de sesión exitoso. Redirigiendo...');
      
      // 4. Redirección (solución para GitHub Pages)
      if (window.location.hostname.includes('github.io')) {
        window.location.href = '/SanPedro_Transportes/#/'; // Ajusta según tu ruta base
      } else {
        navigate('/');
      }

    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.message || 'Error al iniciar sesión');
      
      // Limpiar credenciales en caso de error
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('user');
      
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border pr-10"
                required
                disabled={isLoading}
                placeholder="Ingresa tu contraseña"
                title="Contraseña de acceso"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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



type MisBoletasProps = {
  userId: string;
};
type Boleta = {
  id: string;
  user_id: string;
  ano: number;
  mes: number;
  created_at: string;
  arquivo_url: string;
  // adicione outros campos se houver
};

type Ubicacion = {
  latitude: number;
  longitude: number;
};
type BoletaUsuario = {
  id: string;
  user_id: string;
  created_at: string;
  ano: number;
  mes: number;
  arquivo_url: string; 
  // outros campos...
};

type User  ={
  id: string;
  nombre: string;
  apellido: string;
  sede?: string;
  area?: string;
  activo?: boolean;
  role?: string;
}

type DiaLibre = {
  id: string;
  fecha: string;
  user_id: string;
  users?: User;
  // ... otras propiedades
};

type Workspace = {
  id: number;
  name: string;
  ativo: boolean;
  // adicione outros campos se necessário
};

type TimeEntry = {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string | null;
  end_latitude?: number | null;
  end_longitude?: number | null;
};

// Agrega esto cerca de tus otros tipos
type RegistroCaja = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  valor: number;
  numero_factura?: string;
  user_id: string;
  created_at: string;
};


function MiCaja({ userId }: { userId: string }) {
  const [registros, setRegistros] = useState<RegistroCaja[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalDia, setTotalDia] = useState(0);
  const [balanceMes, setBalanceMes] = useState(0);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso');
  const [tipoMovimientoId, setTipoMovimientoId] = useState<number | null>(null);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historialFiltrado, setHistorialFiltrado] = useState<{ano: number, meses: {mes: number, registros: RegistroCaja[]}[]}>([]);
  const [chartData, setChartData] = useState<{ingresos: any, egresos: any} | null>(null);

  interface TipoMovimiento {
    id: number;
    nombre: string;
    activo: boolean;
    tipo: 'ingreso' | 'egreso';
  }

  interface RegistroCaja {
    id: string;
    fecha: string;
    tipo_movimiento_id: number;
    tipo_movimiento?: {
      id: number;
      nombre: string;
      tipo: 'ingreso' | 'egreso';
    };
    descripcion: string;
    valor: number;
    numero_factura: string | null;
    user_id: string;
    created_at: string;
    tipo?: 'ingreso' | 'egreso';
  }

  // Función para determinar si un movimiento es ingreso o egreso
  const determinarTipo = (nombreMovimiento?: string): 'ingreso' | 'egreso' => {
    if (!nombreMovimiento) return 'egreso';
    
    const nombre = nombreMovimiento.toLowerCase();
    if (nombre.includes('ingreso') || nombre.startsWith('ing')) {
      return 'ingreso';
    }
    if (nombre.includes('egreso') || nombre.startsWith('egr')) {
      return 'egreso';
    }
    
    const tipoEnBD = tiposMovimiento.find(t => t.nombre === nombreMovimiento)?.tipo;
    return tipoEnBD === 'ingreso' ? 'ingreso' : 'egreso';
  };

  // Cargar tipos de movimiento filtrados por tipo seleccionado
  useEffect(() => {
    const cargarTiposMovimiento = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('tipos_movimiento')
          .select('id, nombre, activo, tipo')
          .eq('activo', true)
          .eq('tipo', tipoMovimiento)
          .order('nombre', { ascending: true });
    
        if (error) throw error;
    
        if (!data || data.length === 0) {
          setTiposMovimiento([]);
          setTipoMovimientoId(null);
          
          // Versión segura que funciona con cualquier librería
          const warningMessage = `No hay categorías ${tipoMovimiento} disponibles`;
          if (typeof toast === 'function') {
            if (toast.warning) {
              toast.warning(warningMessage); // Para react-toastify
            } else {
              toast(warningMessage, { // Para react-hot-toast
                icon: '⚠️',
                style: { background: '#fff3cd', color: '#856404' }
              });
            }
          }
          return;
        }
    
        setTiposMovimiento(data);
        setTipoMovimientoId(data[0].id);
        
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = `Error al cargar tipos: ${error.message}`;
        if (typeof toast === 'function') {
          if (toast.error) {
            toast.error(errorMessage);
          } else {
            toast(errorMessage, { 
              icon: '❌',
              style: { background: '#f8d7da', color: '#721c24' }
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    cargarTiposMovimiento();
  }, [tipoMovimiento]);

  // Formatear número en soles
  const formatMoneda = (num: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num).replace('PEN', 'S/');
  };

  // Preparar datos para el gráfico
  const prepararDatosGrafico = (registros: RegistroCaja[]) => {
    // Filtrar y procesar ingresos
    const ingresos = registros.filter(r => determinarTipo(r.tipo_movimiento?.nombre) === 'ingreso');
    const categoriasIngresos = ingresos.reduce((acc, registro) => {
      const categoria = registro.tipo_movimiento?.nombre || 'Otros ingresos';
      acc[categoria] = (acc[categoria] || 0) + registro.valor;
      return acc;
    }, {} as Record<string, number>);

    // Filtrar y procesar egresos
    const egresos = registros.filter(r => determinarTipo(r.tipo_movimiento?.nombre) === 'egreso');
    const categoriasEgresos = egresos.reduce((acc, registro) => {
      const categoria = registro.tipo_movimiento?.nombre || 'Otros egresos';
      acc[categoria] = (acc[categoria] || 0) + registro.valor;
      return acc;
    }, {} as Record<string, number>);

    return {
      ingresos: {
        labels: Object.keys(categoriasIngresos),
        data: Object.values(categoriasIngresos),
        colors: ['#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9']
      },
      egresos: {
        labels: Object.keys(categoriasEgresos),
        data: Object.values(categoriasEgresos),
        colors: ['#F44336', '#E57373', '#EF9A9A', '#FFCDD2']
      }
    };
  };

  // Cargar registros y calcular balances
  const cargarRegistros = async (fechaSeleccionada: string) => {
    setIsLoading(true);
    try {
      // Obtener registros con los tipos de movimiento relacionados
      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_caja')
        .select(`
          id,
          fecha,
          tipo_movimiento_id,
          descripcion,
          valor,
          numero_factura,
          user_id,
          created_at,
          tipos_movimiento:tipos_movimiento(nombre, tipo)
        `)
        .eq('user_id', userId)
        .eq('fecha', fechaSeleccionada)
        .order('created_at', { ascending: true });

      if (registrosError) throw registrosError;

      // Mapear los datos para incluir el tipo_movimiento completo
      const registrosCompletos = registrosData?.map(registro => ({
        ...registro,
        tipo_movimiento: registro.tipos_movimiento,
        tipo: determinarTipo(registro.tipos_movimiento?.nombre)
      })) || [];

      setRegistros(registrosCompletos);
      setChartData(prepararDatosGrafico(registrosCompletos));

      // Cálculo del total diario
      const totalDia = registrosCompletos.reduce((sum, registro) => {
        return registro.tipo === 'ingreso' ? sum + registro.valor : sum - registro.valor;
      }, 0);
      setTotalDia(totalDia);

    } catch (error) {
      console.error('Error cargando registros:', error);
      toast.error('Error al cargar registros de caja');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar historial
  const cargarHistorial = async () => {
    try {
      setIsLoading(true);
      // Obtener registros con los tipos de movimiento relacionados
      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_caja')
        .select(`
          id,
          fecha,
          tipo_movimiento_id,
          descripcion,
          valor,
          numero_factura,
          created_at,
          tipos_movimiento:tipos_movimiento(nombre, tipo)
        `)
        .eq('user_id', userId)
        .order('fecha', { ascending: false });

      if (registrosError) throw registrosError;

      if (!registrosData) {
        setHistorialFiltrado([]);
        return;
      }

      // Organizar datos por año y mes
      const historialPorAno: Record<number, Record<number, RegistroCaja[]>> = {};

      registrosData.forEach(registro => {
        const fecha = new Date(registro.fecha);
        const ano = fecha.getFullYear();
        const mes = fecha.getMonth() + 1;

        if (!historialPorAno[ano]) {
          historialPorAno[ano] = {};
        }

        if (!historialPorAno[ano][mes]) {
          historialPorAno[ano][mes] = [];
        }

        historialPorAno[ano][mes].push({
          ...registro,
          tipo_movimiento: registro.tipos_movimiento,
          tipo: determinarTipo(registro.tipos_movimiento?.nombre)
        });
      });

      // Convertir a la estructura esperada
      const historialFormateado = Object.entries(historialPorAno).map(([anoStr, meses]) => {
        const ano = parseInt(anoStr);
        return {
          ano,
          meses: Object.entries(meses).map(([mesStr, registros]) => ({
            mes: parseInt(mesStr),
            registros
          }))
        };
      });

      setHistorialFiltrado(historialFormateado);

      // Calcular balance mensual
      const balance = registrosData.reduce((sum, reg) => {
        const tipo = determinarTipo(reg.tipos_movimiento?.nombre);
        return tipo === 'ingreso' ? sum + reg.valor : sum - reg.valor;
      }, 0);
      setBalanceMes(balance);

    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId && fecha) {
      cargarRegistros(fecha);
      if (historialVisible) {
        cargarHistorial();
      }
    }
  }, [userId, fecha, historialVisible]);

  // Agregar nuevo registro
  const agregarRegistro = async () => {
    if (!descripcion || !valor) {
      toast.error('Descripción y valor son requeridos');
      return;
    }
  
    if (!tipoMovimientoId) {
      toast.error('Debe seleccionar una categoría');
      return;
    }
  
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) {
      toast.error('El valor debe ser un número');
      return;
    }
  
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registros_caja')
        .insert([{
          fecha,
          tipo_movimiento_id: tipoMovimientoId,
          descripcion,
          valor: valorNumerico,
          numero_factura: numeroFactura || null,
          user_id: userId
        }])
        .select();
  
      if (error) throw error;
  
      toast.success('Registro agregado correctamente');
      setDescripcion('');
      setValor('');
      setNumeroFactura('');
      cargarRegistros(fecha);
    } catch (error) {
      console.error('Error agregando registro:', error);
      toast.error('Error al agregar registro');
    } finally {
      setIsLoading(false);
    }
  };
  

  // Eliminar registro
  const eliminarRegistro = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const { error } = await supabase
        .from('registros_caja')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Registro eliminado correctamente');
      cargarRegistros(fecha);
    } catch (error) {
      console.error('Error eliminando registro:', error);
      toast.error('Error al eliminar registro');
    }
  };

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fecha: date.toLocaleDateString('es-ES'),
      hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Registro de Caja Diaria
      </h2>

      <div className="grid gap-6">
        {/* Filtros y resumen */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
              />
            </div>
          </div>
          
          <button
            onClick={() => setHistorialVisible(!historialVisible)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center"
          >
            {historialVisible ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Ocultar Historial
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ver Historial Completo
              </>
            )}
          </button>
        </div>

        {/* Formulario */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
            {/* Selector de Tipo (Ingreso/Egreso) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={tipoMovimiento}
                onChange={(e) => setTipoMovimiento(e.target.value as 'ingreso' | 'egreso')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>

            {/* Selector de Categoría */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={tipoMovimientoId || ''}
              onChange={(e) => setTipoMovimientoId(Number(e.target.value))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              disabled={tiposMovimiento.length === 0 || isLoading}
            >
              {tiposMovimiento.length === 0 ? (
                <option value="">No hay categorías disponibles</option>
              ) : (
                <>
                  <option value="">Seleccione una categoría</option>
                  {tiposMovimiento.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del movimiento"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº Factura</label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="(Opcional)"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={agregarRegistro}
              disabled={isLoading || !descripcion || !valor || !tipoMovimientoId}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : 'Agregar Registro'}
            </button>
          </div>
        </div>

        {/* Registros del día */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">Movimientos del día</h3>
            <div className="bg-blue-50 px-3 py-1 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Balance del día: 
                <span className={`ml-2 text-lg ${totalDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(totalDia)}
                </span>
              </p>
            </div>
          </div>

          {isLoading && registros.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : registros.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay registros para esta fecha</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.map((registro) => {
                    const esIngreso = determinarTipo(registro.tipo_movimiento?.nombre) === 'ingreso';
                    const { fecha: fechaFormateada, hora } = formatDateTime(registro.created_at);
                    
                    return (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fechaFormateada}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {hora}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            esIngreso ? 
                              'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'
                          }`}>
                            {esIngreso ? 'INGRESO' : 'EGRESO'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {registro.tipo_movimiento?.nombre || 'Desconocido'}
                          {registro.descripcion && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{registro.descripcion}</p>
                          )}
                        </td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                          esIngreso ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {esIngreso ? '+' : '-'}{formatMoneda(registro.valor)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {registro.numero_factura || '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => eliminarRegistro(registro.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Eliminar registro"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gráfico de distribución */}
        {chartData && (
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3 text-center">Distribución por Categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico de ingresos */}
              {chartData.ingresos.data.length > 0 && (
                <div className="h-64">
                  <h4 className="text-center text-sm font-medium text-green-600 mb-2">Ingresos</h4>
                  <Pie
                    data={{
                      labels: chartData.ingresos.labels,
                      datasets: [{
                        data: chartData.ingresos.data,
                        backgroundColor: chartData.ingresos.colors,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 10,
                            usePointStyle: true,
                            font: { size: 10 }
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Gráfico de egresos */}
              {chartData.egresos.data.length > 0 && (
                <div className="h-64">
                  <h4 className="text-center text-sm font-medium text-red-600 mb-2">Egresos</h4>
                  <Pie
                    data={{
                      labels: chartData.egresos.labels,
                      datasets: [{
                        data: chartData.egresos.data,
                        backgroundColor: chartData.egresos.colors,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 10,
                            usePointStyle: true,
                            font: { size: 10 }
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historial */}
        {historialVisible && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h3>
              <div className="bg-purple-50 px-3 py-1 rounded-lg">
                <p className="text-sm font-medium text-purple-800">
                  Balance del mes: 
                  <span className={`ml-2 text-lg ${balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoneda(balanceMes)}
                  </span>
                </p>
              </div>
            </div>
            
            {historialFiltrado.length === 0 ? (
              <p className="text-sm text-gray-500">No hay registros históricos</p>
            ) : (
              <div className="space-y-8">
                {historialFiltrado.map((anoData) => (
                  <div key={anoData.ano} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b">
                      <h4 className="font-medium text-gray-800">{anoData.ano}</h4>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {anoData.meses.map((mesData) => {
                        const nombreMes = new Date(anoData.ano, mesData.mes - 1, 1)
                          .toLocaleString('es-ES', { month: 'long' });
                        
                        const balanceMes = mesData.registros.reduce((sum, reg) => {
                          return reg.tipo === 'ingreso' ? 
                            sum + reg.valor : 
                            sum - reg.valor;
                        }, 0);
                        
                        return (
                          <div key={`${anoData.ano}-${mesData.mes}`} className="bg-white">
                            <div className="px-4 py-3 flex justify-between items-center bg-gray-50">
                              <span className="font-medium text-gray-700 capitalize">
                                {nombreMes}
                              </span>
                              <span className={`text-sm font-medium ${
                                balanceMes >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Balance: {formatMoneda(balanceMes)}
                              </span>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {mesData.registros.map((registro) => {
                                    const esIngreso = determinarTipo(registro.tipo_movimiento?.nombre) === 'ingreso';
                                    const { fecha: fechaFormateada, hora } = formatDateTime(registro.created_at);
                                    
                                    return (
                                      <tr key={registro.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {fechaFormateada}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {hora}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            esIngreso ? 
                                              'bg-green-100 text-green-800' : 
                                              'bg-red-100 text-red-800'
                                          }`}>
                                            {esIngreso ? 'INGRESO' : 'EGRESO'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {registro.tipo_movimiento?.nombre || 'Desconocido'}
                                          {registro.descripcion && (
                                            <p className="text-xs text-gray-500 truncate max-w-xs">{registro.descripcion}</p>
                                          )}
                                        </td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                                          esIngreso ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {esIngreso ? '+' : '-'}{formatMoneda(registro.valor)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {registro.numero_factura || '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



function MisBoletas({ userId }: MisBoletasProps) {

  const [boletas, setBoletas] = useState<Boleta[]>([]);
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

  const handleDownload = (url:string) => {
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
  // Estado para a lista de usuários com tipagem explícita
  const [usuarios, setUsuarios] = useState<Array<{
    id: string;
    nombre: string;
    apellido: string;
    sede?: string;
    area?: string;
  }>>([]);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [boletasExistentes, setBoletasExistentes] = useState<BoletaUsuario[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Carregar usuários ativos
  useEffect(() => {
    const cargarUsuarios = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, nombre, apellido, sede, area')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        if (data) {
          setUsuarios(data);
          if (data.length > 0) {
            setUsuarioSeleccionado(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast.error('Error al cargar la lista de usuarios');
      } finally {
        setIsLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  // Carregar boletas do usuário selecionado
  useEffect(() => {
    if (usuarioSeleccionado) {
      cargarBoletasUsuario();
    }
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
    } catch (error: any) {
      console.error('Error cargando boletas:', error);
      toast.error('Error al cargar boletas: ' + error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
  
    try {
      if (!archivo) {
        throw new Error("Por favor, selecione um arquivo para upload.");
      }
  
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No se pudo obtener la información del usuario autenticado');
      }

      // Verificar se é admin
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
      
      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('boletas-pago')
        .upload(fileName, archivo, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('boletas-pago')
        .getPublicUrl(fileName);
        
      // Registrar no banco de dados
      const { error: insertError } = await supabase
        .from('boletas_usuarios')
        .upsert({
          user_id: usuarioSeleccionado,
          mes: mes,
          ano: ano,
          arquivo_url: publicUrl,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;

      toast.success("¡Boleta subida/actualizada correctamente!");
      setArchivo(null);
      await cargarBoletasUsuario();
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string, url: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta boleta?')) return;
  
    try {
      const filePath = url.split('/storage/v1/object/public/boletas-pago/')[1];
  
      // Remover do storage
      const { error: deleteError } = await supabase.storage
        .from('boletas-pago')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Remover do banco de dados
      const { error: deleteRecordError } = await supabase
        .from('boletas_usuarios')
        .delete()
        .eq('id', id);

      if (deleteRecordError) throw deleteRecordError;

      toast.success('Boleta eliminada correctamente');
      await cargarBoletasUsuario();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error eliminando boleta:', error);
        toast.error('Error al eliminar la boleta: ' + error.message);
      } else {
        console.error('Error desconocido:', error);
        toast.error('Error desconocido');
      }
    }
  };

  // Estado de loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sem usuários disponíveis
  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Gestión de Boletas de Pago
        </h2>
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">No hay usuarios activos disponibles</p>
        </div>
      </div>
    );
  }

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
              title="Seleccionar usuario"
              aria-label="Seleccionar usuario"
              value={usuarioSeleccionado || ''}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
              disabled={isLoading}
            >
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellido} 
                  {usuario.sede ? ` (${usuario.sede})` : ''}
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
              aria-label="Año"
              max="2100"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              title="Seleccionar mes"
              aria-label="Seleccionar mes"
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
            title="Subir archivo de boleta"
            aria-label="Subir archivo de boleta"
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
        
        {boletasExistentes.length === 0 ? (
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
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [sedes, setSedes] = useState<  { id: string; nombre: string }[] >([{ id: 'todos', nombre: 'TODOS' }]); 
  const [sedeSeleccionada, setSedeSeleccionada] = useState('todos');
  const [todosDiasLibres, setTodosDiasLibres] = useState<DiaLibre[]>([]);
  const [modoAsignacion, setModoAsignacion] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsLoading(true);
      try {
        // 1. Cargar usuarios
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('users')
          .select('id, nombre, apellido, sede, area')
          .eq('activo', true)
          .order('nombre', { ascending: true });
  
        if (usuariosError) throw usuariosError;
  
        if (usuariosData) {
          setUsuarios(usuariosData); 
  
          // Sedes únicas (com filtro para remover `null`/`undefined`)
          const sedesUnicas = [...new Set(usuariosData.map(u => u.sede))]
            .filter((sede): sede is string => !!sede) // Remove valores falsy
            .map(sede => ({ id: sede, nombre: sede }));
  
          setSedes([{ id: 'todos', nombre: 'TODOS' }, ...sedesUnicas]); 
        }
  
        // 2. Cargar días libres
        await cargarTodosDiasLibres();
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error al cargar datos iniciales: ' + (error instanceof Error ? error.message : String(error)));
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
  } catch (error: unknown) {
    console.error('Error cargando días libres:', error);
    toast.error(error instanceof Error ? error.message : 'Ocurrió un error desconocido');
  } finally {
    setIsLoading(false);
  }
};
  
  
  
  
  // Generar color único para cada usuario
  const generarColorUsuario = (userId: string) => {
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
  
  const eventStyleGetter = (event: Event) => {
    const customEvent = event as { color?: string } & Event;
    return {
      style: {
        backgroundColor: customEvent.color || '#3174ad',
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
    // Versión segura con verificación de tipos
    const usuariosUnicos = [...new Map(
      todosDiasLibres
        .filter((dia): dia is DiaLibre & { users: NonNullable<DiaLibre['users']> } => 
          !!dia.users
        )
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
  const handleDateChange = (date: Date )=> {
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
              id="usuario-select"
              value={usuarioParaAsignar}                
                onChange={(e) => setUsuarioParaAsignar(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                aria-label="usuario-select-label"
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
  const [registroTiempo, setRegistroTiempo] = useState<TimeEntry | null>(null);
  const [estaTrabajando, setEstaTrabajando] = useState<boolean>(false);
  const [estaProcesando, setEstaProcesando] = useState<boolean>(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(0);
  const [ubicacionActual, setUbicacionActual] = useState<Ubicacion | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [todosRegistros, setTodosRegistros] = useState([]);
  const [lugaresTrabajo, setLugaresTrabajo] = useState<Workspace[]>([]);
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [diasLibres, setDiasLibres] = useState<DiaLibre[]>([]);
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
    let interval: NodeJS.Timeout;
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
        //  toast.error('No se pudo obtener tu ubicación');
        }
      );
    }
  }, []);

  const getLocationPromise = () => {
    return new Promise<GeolocationCoordinates | null>((resolve) => {
      // Si ya tenemos coordenadas, devolvemos esas inmediatamente
      if (ubicacionActual) {
        console.log("Usando ubicación ya almacenada:", ubicacionActual);
        resolve(ubicacionActual);
        return;
      }
  
      if (!navigator.geolocation) {
        console.error("Geolocalización no soportada por el navegador");
        resolve(null);
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Ubicación obtenida:", position.coords);
          // Actualizar estado global
          setUbicacionActual(position.coords);
          setGpsDisabled(false);
          resolve(position.coords);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error.code, error.message);
          // No actualizar gpsDisabled aquí, solo para solicitudes explícitas
          resolve(null);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };
  
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

  // Función mejorada para verificar y activar GPS
    const handleActivarGPS = () => {
      // Verificar si el navegador está en modo incógnito (puede causar problemas de permiso)
      const isIncognito = !window.indexedDB;
      
      if (isIncognito) {
        toast.error('El modo incógnito puede bloquear los permisos de ubicación. Por favor, usa una ventana normal.');
        return;
      }
      
      // Detectar si es dispositivo móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Para dispositivos móviles
        toast(
          <div>
            <p className="font-bold">Pasos para activar el GPS:</p>
            <ol className="list-decimal pl-5 mt-2 text-sm">
              <li>Cierra la app y ve a Configuración</li>
              <li>Busca "Aplicaciones" y luego esta aplicación</li>
              <li>Ve a "Permisos" y activa "Ubicación"</li>
              <li>Regresa a la app y refresca la página</li>
            </ol>
          </div>,
          { duration: 15000 }
        );
      } else {
        // Para navegadores de escritorio
        toast(
          <div>
            <p className="font-bold">Para activar la ubicación:</p>
            <ol className="list-decimal pl-5 mt-2 text-sm">
              <li>Haz clic en el icono de candado en la barra de direcciones</li>
              <li>Busca permisos de ubicación</li>
              <li>Selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>,
          { duration: 15000 }
        );
      }
      
      // Intentar obtener ubicación de forma forzada
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUbicacionActual(position.coords);
            setGpsDisabled(false);
            toast.success('¡GPS activado correctamente!');
          },
          (error) => {
            setGpsDisabled(true);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                toast.error('Permiso denegado para acceder a tu ubicación');
                break;
              case error.POSITION_UNAVAILABLE:
                toast.error('La información de ubicación no está disponible');
                break;
              case error.TIMEOUT:
                toast.error('Tiempo de espera agotado para obtener ubicación');
                break;
              default:
                toast.error('Error desconocido al acceder a la ubicación');
            }
          },
          options
        );
      } else {
        toast.error('Tu navegador no soporta geolocalización');
      }
    };

    // Función para realizar múltiples intentos de obtener la ubicación
    const obtenerUbicacionConIntentos = async (maxIntentos = 3) => {
      let intentos = 0;
      
      while (intentos < maxIntentos) {
        try {
          const coords = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Tiempo de espera agotado'));
            }, 15000);
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timeoutId);
                resolve(position.coords);
              },
              (error) => {
                clearTimeout(timeoutId);
                reject(error);
              },
              { 
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0 
              }
            );
          });
          
          // Si llegamos aquí, hemos obtenido las coordenadas
          return coords;
        } catch (error) {
          intentos++;
          
          // En el último intento, mostrar un mensaje diferente
          if (intentos === maxIntentos) {
            console.error('No se pudo obtener la ubicación después de varios intentos:', error);
            return null;
          }
          
          // Esperamos un momento antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Si no es el último intento, mostramos mensaje de reintento
          if (intentos < maxIntentos) {
            toast('Reintentando obtener ubicación... (' + intentos + '/' + maxIntentos + ')', { 
              icon: '🔄',
              duration: 1000
            });
          }
        }
      }
      
      return null;
    };

  
  
  // Modifique a verificação de geolocalização no useEffect
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual(position.coords);
          setGpsDisabled(false);
        },
        () => {
          setGpsDisabled(true);
        }
      );
    }
  }, []);

// Añadir esto después de los otros useEffect
useEffect(() => {
  // Verificar el estado del GPS periódicamente
  const checkGpsStatus = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsDisabled(false),
        () => setGpsDisabled(true),
        { timeout: 5000 }
      );
    } else {
      setGpsDisabled(true);
    }
  };
  
  // Verificar al inicio
  checkGpsStatus();
  
  // Verificar cada 30 segundos
  const interval = setInterval(checkGpsStatus, 30000);
  
  return () => clearInterval(interval);
}, []);

  
  
  const buscarDiasLibres = async (userId: string) => {
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

  const buscarUltimoRegistro = async (userId: string) => {
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

  // En la función buscarTodosRegistros
const buscarTodosRegistros = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('id, workplace, start_time, end_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(100); // Limitar a 100 registros

    if (error) throw error;
    
    if (data) {
      setTodosRegistros(data);
      // Procesar eventos de manera más eficiente
      const eventos = data.map(registro => ({
        id: registro.id,
        title: registro.workplace,
        start: new Date(registro.start_time),
        end: registro.end_time ? new Date(registro.end_time) : new Date(),
        status: registro.end_time ? 'completado' : 'en progreso',
      }));
      
      setEventosCalendario(eventos);
    }
  } catch (error) {
    console.error('Error buscando todos los registros:', error);
    toast.error('Error al cargar registros históricos');
  }
};

const iniciarTurno = async () => {
  if (!userId) {
    toast.error('Usuario no autenticado');
    return;
  }

  if (estaProcesando) return;
  setEstaProcesando(true);
  
  try {
    // Usar directamente getLocationPromise en lugar de obtenerUbicacionConIntentos
    const coords = await getLocationPromise();
    
    if (!coords) {
      const confirmar = window.confirm(
        'No se pudo obtener tu ubicación. ' +
        '¿Deseas iniciar el turno sin registrar ubicación?\n\n' +
        'Nota: Para registros futuros, asegúrate de permitir el acceso a la ubicación.'
      );
      
      if (!confirmar) {
        toast.error('Operación cancelada por el usuario');
        setEstaProcesando(false);
        return;
      }
    }

    const lugarSeleccionado = lugarTrabajo === 'Otro' ? lugarPersonalizado : lugarTrabajo;

    const nuevoRegistro = {
      user_id: userId,
      workplace: lugarSeleccionado,
      start_time: new Date().toISOString(),
      start_latitude: coords?.latitude || null,
      start_longitude: coords?.longitude || null,
    };

    // Log para depuración
    console.log("Enviando registro:", nuevoRegistro);

    // Guardar en Supabase
    const { data: registro, error } = await supabase
      .from('time_entries')
      .insert([nuevoRegistro])
      .select()
      .single();

    if (error) throw error;

    setRegistroTiempo(registro);
    setEstaTrabajando(true);
    toast.success('¡Turno iniciado correctamente!');
    buscarTodosRegistros(userId);
  } catch (error) {
    console.error('Error iniciando turno:', error);
    toast.error('Error al iniciar el turno: ' + (error.message || 'Error desconocido'));
  } finally {
    setEstaProcesando(false);
  }
};

const finalizarTurno = async () => {
  if (!registroTiempo?.id || estaProcesando) {
    return;
  }

  setEstaProcesando(true);
  
  try {
    // Usar getLocationPromise
    const coords = await getLocationPromise();
    
    if (!coords) {
      const confirmar = window.confirm(
        'No se pudo obtener tu ubicación. ' +
        '¿Deseas finalizar el turno sin registrar ubicación de salida?'
      );
      
      if (!confirmar) {
        toast.error('Finalización cancelada por el usuario');
        setEstaProcesando(false);
        return;
      }
    }

    // Preparar datos para actualización
    const endTime = new Date().toISOString();
    const actualizaciones = {
      end_time: endTime,
      end_latitude: coords?.latitude || null,
      end_longitude: coords?.longitude || null,
    };

    // Log para depuración
    console.log("Actualizando registro:", actualizaciones);

    // Actualizar en Supabase
    const { error } = await supabase
      .from('time_entries')
      .update(actualizaciones)
      .eq('id', registroTiempo.id);

    if (error) throw error;

    // Calcular tiempo trabajado
    const tiempoTotal = new Date(endTime).getTime() - new Date(registroTiempo.start_time).getTime();
    
    // Actualizar estado local
    setRegistroTiempo(null);
    setEstaTrabajando(false);
    setTiempoTranscurrido(0);
    
    // Mostrar feedback al usuario
    toast.success(`¡Turno finalizado! Tiempo trabajado: ${formatDuration(tiempoTotal)}`);
    buscarTodosRegistros(userId);
  } catch (error) {
    console.error('Error finalizando turno:', error);
    toast.error('Error al finalizar el turno: ' + (error.message || 'Error desconocido'));
  } finally {
    setEstaProcesando(false);
  }
};





  const estiloEvento = (evento: {
    status: string;
  }) => {
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
           {/* Pestaña MIS boletas */}
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
              {/* Agrega esta nueva pestaña */}
              <button
                        className={`px-4 py-2 font-medium text-sm flex items-center ${
                          userActiveTab === 'caja' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setUserActiveTab('caja')}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mi Caja
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
                        <Timer className="w-5 h-5 text-gray-500 mt-1" />
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
                    className={`
                      w-full p-4 rounded-lg shadow-sm transition-all duration-200
                      flex items-center justify-center space-x-2 font-medium
                      ${estaProcesando 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'}
                      text-white
                    `}
                    aria-busy={estaProcesando ? "true" : "false"}
                    aria-label={estaProcesando ? 'Procesando inicio de turno' : 'Iniciar turno'}
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

      {userActiveTab === 'caja' && (
        <MiCaja userId={userId} />
      )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <Toaster position="top-right" />
      
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6"> {/* Añadido responsive padding */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"> {/* Layout responsive */}
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
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto"> {/* Layout responsive */}
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm sm:text-base"> {/* Texto responsive */}
                    {userName || userLastName ? 
                      `Hola, ${userName} ${userLastName}` : 
                      `Bienvenido!, ${userEmail}`}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-none"> {/* Email truncado en móvil */}
                    {userEmail}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="text-sm sm:text-base">{currentTime.toLocaleTimeString('es-ES')}</span> {/* Texto responsive */}
              </div>
              
              {ubicacionActual && (
                <div className="hidden sm:flex items-center space-x-2 text-gray-700"> {/* Ocultar en móvil */}
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs">
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
                className="flex items-center space-x-1 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-3 py-1 transition-colors" // Botón mejorado
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Icono responsive */}
                <span>Cerrar sesión</span> 
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const cleanCache = async () => {
      try {
        let registrations: ServiceWorkerRegistration[] = []; // <- declarar aqui
    
        // Limpiar Service Workers
        if ('serviceWorker' in navigator) {
          registrations = [...await navigator.serviceWorker.getRegistrations()];
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
    
        // Limpiar Cache API
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
    
        // Limpiar localStorage y sessionStorage selectivamente
        const itemsToKeep = ['supabase.auth.token'];
        Object.keys(localStorage).forEach(key => {
          if (!itemsToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
    
        Object.keys(sessionStorage).forEach(key => {
          if (!itemsToKeep.includes(key)) {
            sessionStorage.removeItem(key);
          }
        });
    
        // Forzar recarga si se limpió algo
        if (cacheNames.length > 0 || registrations.length > 0) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error cleaning cache:', error);
      }
    };
    
  
    
    cleanCache();

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          setIsLoggedIn(false);
          return;
        }
    
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single()
          .throwOnError();
          
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