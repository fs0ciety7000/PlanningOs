// Register Page - User registration with API

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api-client';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricule: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsLoading(false);
      return;
    }

    try {
      await api.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        matricule: formData.matricule,
        passwordHash: formData.password, // Backend should hash this
        role: 'agent', // Default role
        isActive: true,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Inscription réussie !</h2>
        <p className="text-muted-foreground">
          Votre compte a été créé. Vous allez être redirigé vers la page de connexion.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">PlanningOS</h1>
        <p className="text-muted-foreground mt-1">Créer un compte</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              type="text"
              required
              placeholder="Jean"
              value={formData.firstName}
              onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              type="text"
              required
              placeholder="Dupont"
              value={formData.lastName}
              onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="jean.dupont@example.com"
            value={formData.email}
            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matricule">Matricule</Label>
          <Input
            id="matricule"
            type="text"
            required
            placeholder="AGT001"
            value={formData.matricule}
            onChange={(e) => setFormData((f) => ({ ...f, matricule: e.target.value.toUpperCase() }))}
          />
          <p className="text-xs text-muted-foreground">
            Votre identifiant unique dans l'organisation
          </p>
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
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 caractères
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData((f) => ({ ...f, confirmPassword: e.target.value }))}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Inscription...
            </>
          ) : (
            'S\'inscrire'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
