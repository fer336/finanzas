import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — catches render errors and shows a fallback UI
 * instead of letting the entire tree unmount silently.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error)
          : this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p className="text-[13px] font-medium text-destructive">
            Ocurrió un error inesperado.
          </p>
          <p className="text-[12px] text-muted-foreground">
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-sm border border-border bg-secondary px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export default ErrorBoundary;
