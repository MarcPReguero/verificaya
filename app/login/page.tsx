'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuth((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);
    
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Credenciales incorrectas. Intenta con: demo / demo');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">TS</span>
            </div>
            <span className="text-3xl font-bold text-gray-800">TenantScreen</span>
          </Link>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          {/* Demo Info Banner */}
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
            <div className="flex items-start gap-3 text-white">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="font-bold text-lg mb-1">Cuenta Demo Disponible</p>
                <p className="text-blue-50">
                  Usuario: <span className="font-mono font-bold text-white">demo</span>
                  <br />
                  Contraseña: <span className="font-mono font-bold text-white">demo</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-xl font-semibold">⚠</span>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400 text-base"
                placeholder="demo"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400 text-base"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>

        {/* Quick Access Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔓 Acceso demo sin registro</p>
          <p className="mt-1">Explora todas las funcionalidades</p>
        </div>
      </div>
    </main>
  );
}
