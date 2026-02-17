import React, { Suspense, useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
// import { pagesConfig } from './pages.config' // DISABLE STATIC IMPORT
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError.jsx';

// Layout wrapper that dynamically loads Layout if needed
const LayoutWrapper = ({ children, currentPageName }) => {
  const [LayoutComponent, setLayoutComponent] = useState(null);

  useEffect(() => {
    import('./pages.config').then(module => {
        if (module.pagesConfig && module.pagesConfig.Layout) {
             setLayoutComponent(() => module.pagesConfig.Layout);
        }
    }).catch(err => console.error("Failed to load layout", err));
  }, []);

  if (LayoutComponent) {
      return <LayoutComponent currentPageName={currentPageName}>{children}</LayoutComponent>;
  }
  return <>{children}</>;
};

// Component to render pages dynamically based on config
const DynamicRoutes = () => {
    const [config, setConfig] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        import('./pages.config')
            .then(module => {
                setConfig(module.pagesConfig);
            })
            .catch(err => {
                console.error("Failed to load pages configuration", err);
                setError(err);
            });
    }, []);

    if (error) return (
        <div className="p-10 text-red-500">
            <h1 className="text-xl font-bold">Failed to load app configuration</h1>
            <pre className="mt-4 bg-gray-900 p-4 rounded text-white overflow-auto">
                {error.toString()}
                {error.stack && <div className="mt-2 text-sm text-gray-400">{error.stack}</div>}
            </pre>
        </div>
    );
    if (!config) return <div className="fixed inset-0 flex items-center justify-center">Loading Configuration...</div>;

    const { Pages, mainPage } = config;
    const mainPageKey = mainPage ?? (Pages ? Object.keys(Pages)[0] : null);
    const MainPage = Pages && mainPageKey ? Pages[mainPageKey] : null;

    return (
        <Routes>
            <Route path="/" element={
                <LayoutWrapper currentPageName={mainPageKey}>
                    {MainPage ? <MainPage /> : <div>Main Page Not Found</div>}
                </LayoutWrapper>
            } />
            {Pages && Object.entries(Pages).map(([path, Page]) => (
                <Route
                    key={path}
                    path={`/${path}`}
                    element={
                        <LayoutWrapper currentPageName={path}>
                            <Page />
                        </LayoutWrapper>
                    }
                />
            ))}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } 
    console.warn("Auth error encountered, redirecting to login:", authError);
    navigateToLogin();
    return null;
  }

  return <DynamicRoutes />;
};

function App() {
  console.log('App: Rendering');
  return (
    <div className="text-xl">
      <Suspense fallback={<div className="p-10">Loading Suspense...</div>}>
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
            <Router>
                <NavigationTracker />
                <AuthenticatedApp />
            </Router>
            <Toaster />
            </QueryClientProvider>
        </AuthProvider>
      </Suspense>
    </div>
  )
}

export default App;
