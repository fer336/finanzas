import PropTypes from 'prop-types';
import { useIsMobile } from '../../../hooks/use-mobile';
import MobileDashboardHome from './MobileDashboardHome';

/** Un único resumen mantiene datos, privacidad y controles iguales en ambas vistas. */
const ModernDashboard = (props) => {
  const isMobile = useIsMobile();
  return <MobileDashboardHome {...props} compact={isMobile} />;
};

ModernDashboard.propTypes = {
  user: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  prestamos: PropTypes.array,
  dollarQuotes: PropTypes.array,
  loading: PropTypes.bool,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default ModernDashboard;
