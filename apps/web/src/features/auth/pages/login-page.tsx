// Login Page - Real authentication with API

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api-client';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login({
        email: formData.email,
        password: formData.password,
      });

      // Store user and tokens in auth store
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">PlanningOS</h1>
        <p className="text-muted-foreground mt-1">Connectez-vous à votre compte</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            S'inscrire
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-center text-muted-foreground">
          Comptes de démonstration :
        </p>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p><strong>Admin:</strong> admin@planningos.local / Admin123!</p>
          <p><strong>Planner:</strong> planner@planningos.local / Planner123!</p>
          <p><strong>Agent:</strong> agent@planningos.local / Agent123!</p>
        </div>
      </div>
    </div>
  );
}
