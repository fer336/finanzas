// Script para inicializar datos básicos en NocoDB
import apiServices from '../services/api';

const { categoriasApi, metodosPagoApi, fetchData, postData } = apiServices;

// Categorías básicas
const categoriasBasicas = [
  // Categorías de Ingresos
  {
    Nombre: 'Salario Principal',
    Tipo: 'Ingreso',
    Color: '#10B981',
    Icono: 'DollarSign',
    Activa: true,
    Descripcion: 'Sueldo del trabajo principal'
  },
  {
    Nombre: 'Trabajos Extras',
    Tipo: 'Ingreso', 
    Color: '#3B82F6',
    Icono: 'Briefcase',
    Activa: true,
    Descripcion: 'Freelance, trabajos adicionales'
  },
  {
    Nombre: 'Inversiones',
    Tipo: 'Ingreso',
    Color: '#8B5CF6',
    Icono: 'TrendingUp',
    Activa: true,
    Descripcion: 'Dividendos, intereses, ganancias'
  },
  {
    Nombre: 'Ventas',
    Tipo: 'Ingreso',
    Color: '#F59E0B',
    Icono: 'ShoppingBag',
    Activa: true,
    Descripcion: 'Venta de productos o servicios'
  },
  {
    Nombre: 'Otros Ingresos',
    Tipo: 'Ingreso',
    Color: '#6B7280',
    Icono: 'Plus',
    Activa: true,
    Descripcion: 'Ingresos varios no categorizados'
  },

  // Categorías de Gastos
  {
    Nombre: 'Alimentación',
    Tipo: 'Gasto',
    Color: '#EF4444',
    Icono: 'Coffee',
    Activa: true,
    Descripcion: 'Supermercado, restaurantes, delivery'
  },
  {
    Nombre: 'Servicios Fijos',
    Tipo: 'Gasto',
    Color: '#8B5CF6',
    Icono: 'Home',
    Activa: true,
    Descripcion: 'Luz, gas, agua, internet, teléfono'
  },
  {
    Nombre: 'Transporte',
    Tipo: 'Gasto',
    Color: '#F59E0B',
    Icono: 'Car',
    Activa: true,
    Descripcion: 'Combustible, transporte público, taxi/uber'
  },
  {
    Nombre: 'Entretenimiento',
    Tipo: 'Gasto',
    Color: '#EC4899',
    Icono: 'Film',
    Activa: true,
    Descripcion: 'Cine, teatro, conciertos, streaming'
  },
  {
    Nombre: 'Ocio',
    Tipo: 'Gasto',
    Color: '#06B6D4',
    Icono: 'PartyPopper',
    Activa: true,
    Descripcion: 'Salidas, bares, actividades recreativas'
  },
  {
    Nombre: 'Salud',
    Tipo: 'Gasto',
    Color: '#10B981',
    Icono: 'Heart',
    Activa: true,
    Descripcion: 'Médicos, medicamentos, seguros de salud'
  },
  {
    Nombre: 'Educación',
    Tipo: 'Gasto',
    Color: '#3B82F6',
    Icono: 'BookOpen',
    Activa: true,
    Descripcion: 'Cursos, libros, capacitaciones'
  },
  {
    Nombre: 'Hogar',
    Tipo: 'Gasto',
    Color: '#84CC16',
    Icono: 'House',
    Activa: true,
    Descripcion: 'Alquiler, expensas, mantenimiento, decoración'
  },
  {
    Nombre: 'Ropa y Calzado',
    Tipo: 'Gasto',
    Color: '#F97316',
    Icono: 'Shirt',
    Activa: true,
    Descripcion: 'Vestimenta y accesorios'
  },
  {
    Nombre: 'Tecnología',
    Tipo: 'Gasto',
    Color: '#6366F1',
    Icono: 'Smartphone',
    Activa: true,
    Descripcion: 'Dispositivos, software, reparaciones'
  },
  {
    Nombre: 'Belleza y Cuidado Personal',
    Tipo: 'Gasto',
    Color: '#EC4899',
    Icono: 'Sparkles',
    Activa: true,
    Descripcion: 'Peluquería, cosméticos, higiene'
  },
  {
    Nombre: 'Seguros',
    Tipo: 'Gasto',
    Color: '#64748B',
    Icono: 'Shield',
    Activa: true,
    Descripcion: 'Seguros de auto, hogar, vida'
  },
  {
    Nombre: 'Impuestos y Tasas',
    Tipo: 'Gasto',
    Color: '#DC2626',
    Icono: 'Receipt',
    Activa: true,
    Descripcion: 'Impuestos municipales, patente, etc'
  },
  {
    Nombre: 'Gastos con Hija',
    Tipo: 'Gasto',
    Color: '#F472B6',
    Icono: 'Heart',
    Activa: true,
    Descripcion: 'Todos los gastos relacionados con mi hija'
  },
  {
    Nombre: 'Gastos Financieros',
    Tipo: 'Gasto',
    Color: '#DC2626',
    Icono: 'CreditCard',
    Activa: true,
    Descripcion: 'Intereses, comisiones bancarias, mantenimiento de cuentas'
  },
  {
    Nombre: 'Pago de Tarjetas',
    Tipo: 'Gasto',
    Color: '#7C3AED',
    Icono: 'Receipt',
    Activa: true,
    Descripcion: 'Pagos de resúmenes de tarjetas de crédito'
  },
  {
    Nombre: 'Otros Gastos',
    Tipo: 'Gasto',
    Color: '#6B7280',
    Icono: 'MoreHorizontal',
    Activa: true,
    Descripcion: 'Gastos varios no categorizados'
  }
];

// Métodos de pago básicos
const metodosPagoBasicos = [
  {
    Nombre: 'Efectivo',
    Tipo: 'Efectivo',
    Activo: true,
    Color: '#10B981',
    Icono: 'Banknote',
    Descripcion: 'Pagos en efectivo'
  },
  {
    Nombre: 'Transferencia',
    Tipo: 'Transferencia',
    Activo: true,
    Color: '#3B82F6',
    Icono: 'ArrowRightLeft',
    Descripcion: 'Transferencias bancarias'
  },
  {
    Nombre: 'Tarjeta de Débito',
    Tipo: 'Tarjeta',
    Activo: true,
    Color: '#EF4444',
    Icono: 'CreditCard',
    Descripcion: 'Pagos con tarjeta de débito'
  },
  {
    Nombre: 'Tarjeta de Crédito',
    Tipo: 'Tarjeta',
    Activo: true,
    Color: '#F59E0B',
    Icono: 'CreditCard',
    Descripcion: 'Pagos con tarjeta de crédito'
  }
];

export const inicializarDatos = async () => {
  console.log('Iniciando creación de datos básicos...');
  
  try {
    // Crear usuario por defecto si no existe
    console.log('Verificando si existe usuario...');
    try {
      const usuariosExistentes = await fetchData('m0v332nlyzkbs9d', null, 1, 0);
      if (!usuariosExistentes.list || usuariosExistentes.list.length === 0) {
        console.log('Creando usuario por defecto...');
        const usuarioDefecto = {
          Email: 'usuario@sistema.com',
          NombreCompleto: 'Usuario Sistema',
          Activo: true,
          MonedaPreferida: 'ARS',
          Timezone: 'America/Argentina/Buenos_Aires',
          TemaPreferido: 'dark',
          FechaCreacion: new Date(),
          FechaActualizacion: new Date(),
          UltimoLogin: new Date()
        };
        
        try {
          const usuarioResponse = await postData('m0v332nlyzkbs9d', usuarioDefecto);
          console.log('✅ Usuario por defecto creado:', usuarioResponse);
        } catch (error) {
          console.log('⚠️ Error creando usuario por defecto:', error.message);
        }
      } else {
        console.log('✅ Usuario ya existe');
      }
    } catch (error) {
      console.log('⚠️ Error verificando usuarios:', error.message);
    }

    // Crear categorías
    console.log('Creando categorías básicas...');
    for (const categoria of categoriasBasicas) {
      try {
        const categoriaConFechas = {
          ...categoria,
          FechaCreacion: new Date(),
          FechaActualizacion: new Date()
        };
        const response = await categoriasApi.create(categoriaConFechas);
        console.log(`✅ Categoría creada: ${categoria.Nombre}`, response);
      } catch (error) {
        console.log(`⚠️ Error creando categoría ${categoria.Nombre}:`, error.message);
      }
    }
    
    // Crear métodos de pago
    console.log('Creando métodos de pago básicos...');
    for (const metodo of metodosPagoBasicos) {
      try {
        const metodoConFechas = {
          ...metodo,
          FechaCreacion: new Date()
        };
        const response = await metodosPagoApi.create(metodoConFechas);
        console.log(`✅ Método de pago creado: ${metodo.Nombre}`, response);
      } catch (error) {
        console.log(`⚠️ Error creando método ${metodo.Nombre}:`, error.message);
      }
    }
    
    console.log('✅ Inicialización de datos completada');
    return true;
    
  } catch (error) {
    console.error('❌ Error en inicialización de datos:', error);
    return false;
  }
};

export default inicializarDatos;