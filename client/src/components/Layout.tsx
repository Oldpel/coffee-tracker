
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    logout();
    setLocation('/login');
  };

  const navItems = [
    { href: '/', label: '仪表盘' },
    { href: '/beans', label: '我的豆子' },
    { href: '/community', label: '社群交流' }
  ];

  return (
    <div className="min-h-screen text-foreground">
      <div className="liquid-glass-container sticky top-4 z-50 mx-4 sm:mx-6 lg:mx-8">
        <nav className="liquidGlass-wrapper rounded-2xl bg-white/30">
          <div className="liquidGlass-effect rounded-2xl"></div>
          <div className="liquidGlass-tint rounded-2xl"></div>
          <div className="liquidGlass-shine rounded-2xl"></div>
          <div className="liquidGlass-text rounded-2xl max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex space-x-8">
                <Link href="/">
                  <span className="font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity">
                    Coffee Tracker
                  </span>
                </Link>
                <div className="hidden md:flex space-x-2 relative">
                  {navItems.map((item) => {
                    const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className="relative px-4 py-2 cursor-pointer group rounded-xl">
                          {isActive && (
                              <motion.div
                              layoutId="liquid-nav-indicator"
                              className="absolute inset-0 bg-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-white/50 rounded-xl z-0"
                              transition={{ 
                                type: "spring", 
                                stiffness: 450, 
                                damping: 18, 
                                mass: 0.5 
                              }}
                            />
                          )}
                          <span className={`relative z-10 text-sm font-bold transition-colors duration-300 ${isActive ? 'text-primary drop-shadow-sm' : 'text-gray-600 group-hover:text-primary/80'}`}>
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <span className="text-sm text-gray-700 font-medium hidden sm:inline-block">
                      欢迎, {user.name}
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors bg-white/40 px-4 py-2 rounded-xl border border-white/50 hover:bg-white/60 shadow-sm"
                    >
                      退出登录
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        {children}
      </main>
    </div>
  );
}
