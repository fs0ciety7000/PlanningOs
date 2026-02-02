// Agents Admin Page - CRUD for user management with real API data

import { useState } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/types/api';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'planner', label: 'Planificateur' },
  { value: 'agent', label: 'Agent' },
];

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  matricule: string;
  role: UserRole;
  password: string;
}

const emptyForm: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  matricule: '',
  role: 'agent',
  password: '',
};

export function AgentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);

  // Fetch users from API
  const { data: users = [], isLoading, refetch } = useUsers();

  const createMutation = useCreateUser({
    onSuccess: () => {
      toast({ title: 'Agent créé', description: 'L\'agent a été créé avec succès.' });
      setIsCreateOpen(false);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useUpdateUser({
    onSuccess: () => {
      toast({ title: 'Agent mis à jour', description: 'Les modifications ont été enregistrées.' });
      setEditingUser(null);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast({ title: 'Agent supprimé', description: 'L\'agent a été supprimé.' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.matricule) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      matricule: formData.matricule,
      role: formData.role,
      passwordHash: formData.password || 'TempPassword123!', // Backend should hash
      isActive: true,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        matricule: formData.matricule,
        role: formData.role,
      },
    });
  };

  const handleDelete = (user: User) => {
    if (confirm(`Supprimer l'agent "${user.firstName} ${user.lastName}" ?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      matricule: user.matricule,
      role: user.role,
      password: '',
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData(emptyForm);
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.matricule.toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs font-medium">
            Admin
          </span>
        );
      case 'planner':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
            Planificateur
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
            Agent
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Agents</h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Chargement...' : `${users.length} utilisateur(s)`}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvel Agent</DialogTitle>
              <DialogDescription>
                Créez un nouveau compte utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricule">Matricule *</Label>
                  <Input
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => setFormData((f) => ({ ...f, matricule: e.target.value.toUpperCase() }))}
                    placeholder="AGT001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData((f) => ({ ...f, role: v as UserRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe temporaire</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Laisser vide pour mot de passe par défaut"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'agent</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Prénom *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Nom *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMatricule">Matricule *</Label>
                <Input
                  id="editMatricule"
                  value={formData.matricule}
                  onChange={(e) => setFormData((f) => ({ ...f, matricule: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((f) => ({ ...f, role: v as UserRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un agent..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des agents...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'Aucun agent trouvé' : 'Aucun agent enregistré'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Matricule</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-muted rounded text-xs">{user.matricule}</code>
                  </td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-medium">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
