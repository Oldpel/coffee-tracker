import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../trpc';
import SHA256 from 'crypto-js/sha256';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import { useQueryClient } from '@tanstack/react-query';

import { motion } from 'framer-motion';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      queryClient.clear();
      login(data.token, {
        id: data.user.id,
        name: data.user.name || 'Unknown',
        role: data.user.role || 'user'
      });
      setLocation('/');
    },
    onError: (err) => setError(err.message)
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      queryClient.clear();
      login(data.token, {
        id: data.user.id,
        name: data.user.name || 'Unknown',
        role: data.user.role || 'user'
      });
      setLocation('/');
    },
    onError: (err) => setError(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('请输入邮箱');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位');
      return;
    }

    // Client-side encryption before transmission
    const hashedPassword = SHA256(password).toString();

    if (isLoginView) {
      loginMutation.mutate({ email, password: hashedPassword });
    } else {
      if (!name) {
        setError('请输入您的昵称');
        return;
      }
      registerMutation.mutate({ email, password: hashedPassword, name });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <LiquidGlassPanel className="w-full max-w-md" paddingClass="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Coffee Tracker</h1>
          <p className="text-gray-600 font-medium">{isLoginView ? '欢迎回来，请登录' : '创建新账号'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm text-red-600 border border-red-200 rounded-xl text-sm text-center shadow-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1" htmlFor="name">昵称</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
                placeholder="咖啡爱好者"
                disabled={isPending}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1" htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="you@example.com"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1" htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <motion.button 
            type="submit" 
            disabled={isPending}
            className="w-full glass-button mt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {isPending ? '请稍候...' : (isLoginView ? '登录' : '注册并登录')}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <motion.button 
            type="button" 
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError('');
            }}
            className="text-sm text-primary hover:text-primary/80 transition-colors mt-6 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoginView ? '没有账号？立即注册' : '已有账号？返回登录'}
          </motion.button>
        </div>
        
        <p className="mt-8 text-xs text-gray-500 text-center font-medium">
          登录即表示您同意我们的服务条款和隐私政策。
        </p>
      </LiquidGlassPanel>
    </div>
  );
}
