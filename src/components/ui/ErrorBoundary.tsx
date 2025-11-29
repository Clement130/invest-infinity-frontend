import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from './icons';

// Types d'erreurs
export type ErrorType = 'network' | 'auth' | 'data' | 'ui' | 'unknown';

export interface ErrorContext {
  component: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

// Interface pour les stratégies de récupération
export interface RecoveryStrategy {
  type: 'retry' | 'reload' | 'redirect' | 'fallback' | 'report';
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

// Props pour les error boundaries
interface BaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void;
  context?: string;
  showDetails?: boolean;
  recoveryStrategies?: RecoveryStrategy[];
}

interface FeatureErrorBoundaryProps extends BaseErrorBoundaryProps {
  feature: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Détecter le type d'erreur
function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'auth';
  }
  if (message.includes('data') || message.includes('json') || message.includes('parse')) {
    return 'data';
  }
  if (message.includes('component') || message.includes('render') || message.includes('react')) {
    return 'ui';
  }

  return 'unknown';
}

// Composant de fallback par défaut
const DefaultErrorFallback: React.FC<{
  error: Error;
  errorType: ErrorType;
  context: ErrorContext;
  recoveryStrategies: RecoveryStrategy[];
  showDetails: boolean;
}> = ({ error, errorType, context, recoveryStrategies, showDetails }) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-12 h-12 text-red-500" />;
      case 'auth':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'data':
        return <Bug className="w-12 h-12 text-orange-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Problème de connexion';
      case 'auth':
        return 'Erreur d\'authentification';
      case 'data':
        return 'Erreur de données';
      case 'ui':
        return 'Erreur d\'interface';
      default:
        return 'Une erreur est survenue';
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'network':
        return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      case 'auth':
        return 'Vous n\'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.';
      case 'data':
        return 'Les données n\'ont pas pu être chargées correctement.';
      case 'ui':
        return 'Un problème est survenu dans l\'interface utilisateur.';
      default:
        return 'Une erreur inattendue s\'est produite. Nos équipes ont été notifiées.';
    }
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {getErrorIcon()}

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {getErrorTitle()}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {getErrorMessage()}
        </p>

        {/* Actions de récupération */}
        {recoveryStrategies.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {recoveryStrategies.map((strategy, index) => (
              <button
                key={index}
                onClick={strategy.action}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  strategy.primary
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {strategy.type === 'retry' && <RefreshCw className="w-4 h-4 mr-2" />}
                {strategy.type === 'reload' && <RefreshCw className="w-4 h-4 mr-2" />}
                {strategy.type === 'redirect' && <Home className="w-4 h-4 mr-2" />}
                {strategy.label}
              </button>
            ))}
          </div>
        )}

        {/* Détails de l'erreur (seulement en développement) */}
        {showDetails && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Détails techniques
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              <strong>Erreur:</strong> {error.message}
              {error.stack && (
                <>
                  <br /><br />
                  <strong>Stack:</strong><br />
                  {error.stack}
                </>
              )}
              <br /><br />
              <strong>Contexte:</strong> {context.component}
              <br />
              <strong>Timestamp:</strong> {context.timestamp.toISOString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Error Boundary de base
export class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, { hasError: boolean; error: Error | null }> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: this.props.context || 'Unknown',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Appeler le callback d'erreur si fourni
    this.props.onError?.(error, errorInfo, context);

    // Log dans la console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = detectErrorType(this.state.error);
      const context: ErrorContext = {
        component: this.props.context || 'Unknown',
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const defaultStrategies: RecoveryStrategy[] = [
        {
          type: 'retry',
          label: 'Réessayer',
          action: () => window.location.reload(),
          primary: true
        }
      ];

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorType={errorType}
          context={context}
          recoveryStrategies={this.props.recoveryStrategies || defaultStrategies}
          showDetails={this.props.showDetails || false}
        />
      );
    }

    return this.props.children;
  }
}

// Error Boundary pour les fonctionnalités
export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, { hasError: boolean; error: Error | null; retryCount: number }> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: this.props.feature,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log selon la sévérité
    const severity = this.props.severity || 'medium';
    const logMethod = severity === 'critical' ? console.error :
                     severity === 'high' ? console.warn : console.info;

    logMethod(`[${severity.toUpperCase()}] Feature "${this.props.feature}" crashed:`, error, errorInfo);

    // Rapporter l'erreur selon la sévérité
    if (severity === 'critical' || severity === 'high') {
      // Ici on pourrait envoyer à un service de monitoring
      this.reportError(error, errorInfo, context, severity);
    }

    this.props.onError?.(error, errorInfo, context);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, context: ErrorContext, severity: string) => {
    // Simulation d'envoi à un service de monitoring
    const errorReport = {
      message: error.message,
      stack: error.stack,
      component: context.component,
      severity,
      timestamp: context.timestamp.toISOString(),
      userAgent: context.userAgent,
      url: context.url,
      errorInfo
    };

    // En production, envoyer à Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      console.log('Error report:', errorReport);
      // navigator.sendBeacon('/api/errors', JSON.stringify(errorReport));
    }
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = detectErrorType(this.state.error);
      const severity = this.props.severity || 'medium';

      // Stratégies de récupération selon la sévérité et le nombre de tentatives
      let strategies: RecoveryStrategy[] = [];

      if (this.state.retryCount < 2) {
        strategies.push({
          type: 'retry',
          label: 'Réessayer',
          action: this.handleRetry,
          primary: true
        });
      }

      if (severity === 'critical') {
        strategies.push({
          type: 'reload',
          label: 'Recharger la page',
          action: this.handleReload
        });
      }

      strategies.push({
        type: 'redirect',
        label: 'Retour à l\'accueil',
        action: this.handleGoHome
      });

      const context: ErrorContext = {
        component: this.props.feature,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorType={errorType}
          context={context}
          recoveryStrategies={strategies}
          showDetails={this.props.showDetails || severity === 'high'}
        />
      );
    }

    return this.props.children;
  }
}

// Error Boundary pour les sections admin
export const AdminErrorBoundary: React.FC<{ children: ReactNode; section: string }> = ({
  children,
  section
}) => (
  <FeatureErrorBoundary
    feature={`admin-${section}`}
    severity="high"
    context={`AdminSection:${section}`}
    recoveryStrategies={[
      {
        type: 'retry',
        label: 'Recharger la section',
        action: () => window.location.reload(),
        primary: true
      },
      {
        type: 'redirect',
        label: 'Retour au dashboard',
        action: () => window.location.href = '/admin'
      }
    ]}
  >
    {children}
  </FeatureErrorBoundary>
);

// Error Boundary pour les fonctionnalités utilisateur
export const UserFeatureErrorBoundary: React.FC<{
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
}> = ({ children, feature, fallback }) => (
  <FeatureErrorBoundary
    feature={feature}
    severity="medium"
    context={`UserFeature:${feature}`}
    fallback={fallback}
    recoveryStrategies={[
      {
        type: 'retry',
        label: 'Réessayer',
        action: () => window.location.reload(),
        primary: true
      }
    ]}
  >
    {children}
  </FeatureErrorBoundary>
);

// Error Boundary pour les données (avec retry automatique)
export const DataErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry?: () => void;
}> = ({ children, onRetry }) => (
  <BaseErrorBoundary
    context="DataLoading"
    recoveryStrategies={[
      {
        type: 'retry',
        label: 'Recharger les données',
        action: () => {
          onRetry?.();
          window.location.reload();
        },
        primary: true
      }
    ]}
  >
    {children}
  </BaseErrorBoundary>
);

// Hook pour gérer les erreurs de manière centralisée
export function useErrorHandler() {
  return {
    handleError: (error: Error, context: Partial<ErrorContext> = {}) => {
      const fullContext: ErrorContext = {
        component: context.component || 'Unknown',
        action: context.action,
        userId: context.userId,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.error('Handled error:', error, fullContext);

      // Ici on pourrait envoyer à un service de monitoring
      // sendToMonitoring(error, fullContext);
    },

    handleAsyncError: async (promise: Promise<any>, context?: Partial<ErrorContext>) => {
      try {
        return await promise;
      } catch (error) {
        this.handleError(error as Error, context);
        throw error;
      }
    }
  };
}
