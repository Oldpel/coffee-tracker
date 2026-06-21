import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './trpc';
import { Route, Switch, useLocation } from 'wouter';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import BeansList from './pages/BeansList';
import BeanDetail from './pages/BeanDetail';
import CommunityPage from './pages/CommunityPage';
import RecordsList from './pages/RecordsList';
import Login from './pages/Login';
import Layout from './components/Layout';

import { useEffect } from 'react';

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return <div className="p-12 text-center">验证中...</div>;
  if (!isAuthenticated) return null;
  return <Component />;
}

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AuthProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/*">
              <Layout>
                <Switch>
                  <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
                  <Route path="/beans" component={() => <ProtectedRoute component={BeansList} />} />
                  <Route path="/beans/:id" component={() => <ProtectedRoute component={BeanDetail} />} />
                  <Route path="/records" component={() => <ProtectedRoute component={RecordsList} />} />
                  <Route path="/community" component={() => <ProtectedRoute component={CommunityPage} />} />
                  <Route>404: No such page!</Route>
                </Switch>
              </Layout>
            </Route>
          </Switch>
        </QueryClientProvider>
      </trpc.Provider>
    </AuthProvider>
  );
}

export default App;
