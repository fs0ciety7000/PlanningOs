// Shift Types Admin Page - CRUD for shift types configuration

import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
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
import { getShiftColor, getContrastColor } from '@/lib/utils';
import {
  useShiftTypes,
  useCreateShiftType,
  useUpdateShiftType,
  useDeleteShiftType,
} from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { ShiftType, ShiftCategory } from '@/types/api';

const CATEGORIES: { value: ShiftCategory; label: string }[] = [
  { value: 'work', label: 'Travail' },
  { value: 'rest', label: 'Repos' },
  { value: 'leave', label: 'Congé' },
  { value: 'special', label: 'Spécial' },
];

const DEFAULT_COLORS: Record<ShiftCategory, string> = {
  work: '#FFD9E6',
  rest: '#CCCCCC',
  leave: '#FFFFCC',
  special: '#FF4444',
};

interface ShiftFormData {
  code: string;
  description: string;
  category: ShiftCategory;
  durationMinutes: number;
  nightMinutes: number;
  color: string;
  countsTowardsQuota: boolean;
}

const emptyForm: ShiftFormData = {
  code: '',
  description: '',
  category: 'work',
  durationMinutes: 480,
  nightMinutes: 120,
  color: '#FFD9E6',
  countsTowardsQuota: true,
};

export function ShiftTypesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>(emptyForm);

  const { data: shiftTypes = [], isLoading, refetch } = useShiftTypes();

  const createMutation = useCreateShiftType({
    onSuccess: () => {
      toast({ title: 'Type créé', description: 'Le type de service a été créé avec succès.' });
      setIsCreateOpen(false);
      setFormData(emptyForm);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useUpdateShiftType({
    onSuccess: () => {
      toast({ title: 'Type mis à jour', description: 'Le type de service a été modifié.' });
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useDeleteShiftType({
    onSuccess: () => {
      toast({ title: 'Type supprimé', description: 'Le type de service a été supprimé.' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    if (!formData.code || !formData.description) {
      toast({ title: 'Erreur', description: 'Code et description sont obligatoires.', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      code: formData.code,
      description: formData.description,
      category: formData.category,
      durationMinutes: formData.durationMinutes,
      nightMinutes: formData.nightMinutes,
      color: formData.color,
      countsTowardsQuota: formData.countsTowardsQuota,
    });
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        description: formData.description,
        category: formData.category,
        durationMinutes: formData.durationMinutes,
        nightMinutes: formData.nightMinutes,
        color: formData.color,
        countsTowardsQuota: formData.countsTowardsQuota,
      },
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Supprimer le type de service "${code}" ?`)) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (shiftType: ShiftType) => {
    setEditingId(shiftType.id);
    setFormData({
      code: shiftType.code,
      description: shiftType.description,
      category: shiftType.category,
      durationMinutes: shiftType.durationMinutes,
      nightMinutes: shiftType.nightMinutes,
      color: shiftType.color,
      countsTowardsQuota: shiftType.countsTowardsQuota,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  // Group shift types by category
  const groupedShiftTypes = shiftTypes.reduce((acc, st) => {
    if (!acc[st.category]) acc[st.category] = [];
    acc[st.category].push(st);
    return acc;
  }, {} as Record<string, ShiftType[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Types de Service</h1>
          <p className="text-muted-foreground">
            Configuration des codes de prestation et repos
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouveau Type de Service</DialogTitle>
              <DialogDescription>
                Créez un nouveau code de service ou de repos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="ex: 101, RH, CN"
                    value={formData.code}
                    onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData((f) => ({
                      ...f,
                      category: v as ShiftCategory,
                      color: DEFAULT_COLORS[v as ShiftCategory],
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="ex: Service Standard Matin"
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (heures)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.durationMinutes / 60}
                    onChange={(e) => setFormData((f) => ({ ...f, durationMinutes: parseFloat(e.target.value) * 60 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="night">Heures de nuit</Label>
                  <Input
                    id="night"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.nightMinutes / 60}
                    onChange={(e) => setFormData((f) => ({ ...f, nightMinutes: parseFloat(e.target.value) * 60 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    className="w-16 h-10 p-1"
                    value={formData.color}
                    onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                  />
                  <div
                    className="flex-1 rounded-lg p-3 text-center font-bold"
                    style={{
                      backgroundColor: formData.color,
                      color: getContrastColor(formData.color),
                    }}
                  >
                    {formData.code || 'CODE'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="quota"
                  checked={formData.countsTowardsQuota}
                  onChange={(e) => setFormData((f) => ({ ...f, countsTowardsQuota: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="quota" className="font-normal">
                  Compte dans les quotas de période
                </Label>
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

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : (
        /* Grid by category */
        Object.entries(groupedShiftTypes).map(([category, types]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold capitalize">
              {CATEGORIES.find((c) => c.value === category)?.label || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((shift) => {
                const isEditing = editingId === shift.id;
                const bgColor = isEditing ? formData.color : shift.color;
                const textColor = getContrastColor(bgColor);

                return (
                  <div
                    key={shift.id}
                    className="bg-card border rounded-lg overflow-hidden"
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      <span className="font-bold text-lg">{shift.code}</span>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdate(shift.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4" style={{ color: textColor }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" style={{ color: textColor }} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(shift)}
                            >
                              <Edit2 className="h-4 w-4" style={{ color: textColor }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(shift.id, shift.code)}
                            >
                              <Trash2 className="h-4 w-4" style={{ color: textColor }} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={formData.description}
                            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Description"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={formData.durationMinutes / 60}
                              onChange={(e) => setFormData((f) => ({ ...f, durationMinutes: parseFloat(e.target.value) * 60 }))}
                              placeholder="Heures"
                            />
                            <Input
                              type="number"
                              value={formData.nightMinutes / 60}
                              onChange={(e) => setFormData((f) => ({ ...f, nightMinutes: parseFloat(e.target.value) * 60 }))}
                              placeholder="H. nuit"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{shift.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{shift.durationMinutes / 60}h travail</span>
                            <span>{shift.nightMinutes / 60}h nuit</span>
                            {shift.countsTowardsQuota && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300">
                                quota
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Note sur les codes
        </p>
        <ul className="mt-2 text-blue-700 dark:text-blue-300 space-y-1">
          <li>
            • Codes <strong>7xxx</strong> : Indiquent un travail sur jour férié
            (nécessite RR)
          </li>
          <li>
            • Codes <strong>6xxx</strong> : Variante des codes standards
          </li>
          <li>
            • Le code <strong>AG</strong> (Grève) est affiché en rouge
          </li>
        </ul>
      </div>
    </div>
  );
}
