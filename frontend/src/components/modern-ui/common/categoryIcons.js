import ForkKnife from 'reicon-react/icons/ForkKnife';
import BasketShopping from 'reicon-react/icons/BasketShopping';
import Car from 'reicon-react/icons/Car';
import GasPump from 'reicon-react/icons/GasPump';
import Bus from 'reicon-react/icons/Bus';
import Home2 from 'reicon-react/icons/Home2';
import Electricity2 from 'reicon-react/icons/Electricity2';
import HomeWifi from 'reicon-react/icons/HomeWifi';
import Health from 'reicon-react/icons/Health';
import MedicalKit from 'reicon-react/icons/MedicalKit';
import Film from 'reicon-react/icons/Film';
import Gamepad2 from 'reicon-react/icons/Gamepad2';
import GraduationCap from 'reicon-react/icons/GraduationCap';
import Book2 from 'reicon-react/icons/Book2';
import Tshirt from 'reicon-react/icons/Tshirt';
import Paw from 'reicon-react/icons/Paw';
import Plane from 'reicon-react/icons/Plane';
import Gift2 from 'reicon-react/icons/Gift2';
import Subscription2 from 'reicon-react/icons/Subscription2';
import Tv from 'reicon-react/icons/Tv';
import Wallet2 from 'reicon-react/icons/Wallet2';
import BadgeDollar from 'reicon-react/icons/BadgeDollar';
import ChartTrend from 'reicon-react/icons/ChartTrend';
import TrendUp2 from 'reicon-react/icons/TrendUp2';
import Briefcase2 from 'reicon-react/icons/Briefcase2';
import Coins from 'reicon-react/icons/Coins';
import Bank from 'reicon-react/icons/Bank';
import Coffee2 from 'reicon-react/icons/Coffee2';
import Dumbbell from 'reicon-react/icons/Dumbbell';
import FolderOpen from 'reicon-react/icons/FolderOpen';

// lucide-react, importados uno por uno (no `import * as` — eso mete las
// 5000+ íconos de lucide en este chunk, ~900KB). Cubre el vocabulario de
// categorías creadas con el picker de íconos anterior a este (guardaban
// nombres de lucide-react, ej. "tag" / "Folder" — visto en producción).
import {
  Tag,
  Folder,
  ShoppingCart,
  ShoppingBag,
  Car as LucideCar,
  Bus as LucideBus,
  Fuel,
  Home as LucideHome,
  Zap,
  Wifi,
  Heart,
  Pill,
  Stethoscope,
  Film as LucideFilm,
  Gamepad2 as LucideGamepad2,
  GraduationCap as LucideGraduationCap,
  Book,
  Shirt,
  PawPrint,
  Plane as LucidePlane,
  Gift,
  Tv as LucideTv,
  DollarSign,
  Wallet,
  TrendingUp,
  Briefcase,
  Coins as LucideCoins,
  Landmark,
  Coffee,
  Dumbbell as LucideDumbbell,
  Music,
  Smartphone,
  Utensils,
  Baby,
  Users,
  CreditCard,
  PiggyBank,
  Receipt,
  Building2,
  Wrench,
} from 'lucide-react';

/**
 * Set curado de íconos reicon-react para categorías (tema "Papel").
 * `icono` en el backend es un string libre ("Emoji o icono de la
 * categoría") — las categorías nuevas guardan el `name` de acá; las
 * viejas siguen guardando un emoji o un nombre de lucide-react (ver
 * LEGACY_LUCIDE_ICON_MAP). `getCategoryIcon` resuelve los tres casos sin
 * necesitar migrar datos.
 */
export const CATEGORY_ICON_OPTIONS = [
  { name: 'ForkKnife', label: 'Comida', Icon: ForkKnife },
  { name: 'BasketShopping', label: 'Supermercado', Icon: BasketShopping },
  { name: 'Coffee2', label: 'Café', Icon: Coffee2 },
  { name: 'Car', label: 'Transporte', Icon: Car },
  { name: 'GasPump', label: 'Combustible', Icon: GasPump },
  { name: 'Bus', label: 'Transporte público', Icon: Bus },
  { name: 'Home2', label: 'Hogar', Icon: Home2 },
  { name: 'Electricity2', label: 'Servicios', Icon: Electricity2 },
  { name: 'HomeWifi', label: 'Internet', Icon: HomeWifi },
  { name: 'Health', label: 'Salud', Icon: Health },
  { name: 'MedicalKit', label: 'Farmacia', Icon: MedicalKit },
  { name: 'Film', label: 'Entretenimiento', Icon: Film },
  { name: 'Gamepad2', label: 'Gaming', Icon: Gamepad2 },
  { name: 'GraduationCap', label: 'Educación', Icon: GraduationCap },
  { name: 'Book2', label: 'Libros', Icon: Book2 },
  { name: 'Tshirt', label: 'Ropa', Icon: Tshirt },
  { name: 'Paw', label: 'Mascotas', Icon: Paw },
  { name: 'Plane', label: 'Viajes', Icon: Plane },
  { name: 'Gift2', label: 'Regalos', Icon: Gift2 },
  { name: 'Subscription2', label: 'Suscripciones', Icon: Subscription2 },
  { name: 'Tv', label: 'Streaming', Icon: Tv },
  { name: 'Dumbbell', label: 'Gimnasio', Icon: Dumbbell },
  { name: 'Wallet2', label: 'Sueldo', Icon: Wallet2 },
  { name: 'BadgeDollar', label: 'Ingresos', Icon: BadgeDollar },
  { name: 'ChartTrend', label: 'Inversiones', Icon: ChartTrend },
  { name: 'TrendUp2', label: 'Ahorro', Icon: TrendUp2 },
  { name: 'Briefcase2', label: 'Trabajo', Icon: Briefcase2 },
  { name: 'Coins', label: 'Efectivo', Icon: Coins },
  { name: 'Bank', label: 'Banco', Icon: Bank },
  { name: 'FolderOpen', label: 'Otros', Icon: FolderOpen },
];

const CATEGORY_ICON_MAP = CATEGORY_ICON_OPTIONS.reduce((map, opt) => {
  map[opt.name] = opt.Icon;
  return map;
}, {});

// Nombres de lucide-react de picker(s) viejos, case-insensitive (la data
// real tiene mezcla de casing: "tag" en minúscula, "Folder" en PascalCase).
const LEGACY_LUCIDE_ICON_MAP = {
  tag: Tag,
  folder: Folder,
  shoppingcart: ShoppingCart,
  shoppingbag: ShoppingBag,
  car: LucideCar,
  bus: LucideBus,
  fuel: Fuel,
  home: LucideHome,
  zap: Zap,
  wifi: Wifi,
  heart: Heart,
  pill: Pill,
  stethoscope: Stethoscope,
  film: LucideFilm,
  gamepad2: LucideGamepad2,
  graduationcap: LucideGraduationCap,
  book: Book,
  shirt: Shirt,
  pawprint: PawPrint,
  plane: LucidePlane,
  gift: Gift,
  tv: LucideTv,
  dollarsign: DollarSign,
  wallet: Wallet,
  trendingup: TrendingUp,
  briefcase: Briefcase,
  coins: LucideCoins,
  landmark: Landmark,
  coffee: Coffee,
  dumbbell: LucideDumbbell,
  music: Music,
  smartphone: Smartphone,
  utensils: Utensils,
  baby: Baby,
  users: Users,
  creditcard: CreditCard,
  piggybank: PiggyBank,
  receipt: Receipt,
  building2: Building2,
  wrench: Wrench,
};

export const DEFAULT_CATEGORY_ICON = FolderOpen;

/**
 * Resuelve `iconoValue` a un componente de ícono, probando en orden:
 * 1. Nombre reicon del picker curado de acá arriba (categorías nuevas,
 *    ver CategoryModal).
 * 2. Nombre de lucide-react conocido, case-insensitive (categorías viejas
 *    creadas con el picker anterior al de reicon — ej. "tag" / "Folder").
 * Si no matchea ninguno (ej. emoji), devuelve null y el caller decide el
 * fallback — típicamente renderizar el string tal cual.
 */
export const getCategoryIcon = (iconoValue) => {
  if (!iconoValue) return null;
  return CATEGORY_ICON_MAP[iconoValue] || LEGACY_LUCIDE_ICON_MAP[iconoValue.toLowerCase()] || null;
};
