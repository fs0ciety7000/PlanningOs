// Shift Cell Editor - Modal for editing a schedule cell

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/use-api';
import type { ShiftType, ScheduleWithDetails } from '@/types/api';

interface ShiftCellEditorProps {
  userId: string;
  date: string;
  schedule?: ScheduleWithDetails;
  shiftTypes: ShiftType[];
  onClose: () => void;
}

export function ShiftCellEditor({
  userId,
  date,
  schedule,
  shiftTypes,
  onClose,
}: ShiftCellEditorProps) {
  const { toast } = useToast();
  const [selectedCode, setSelectedCode] = useState<string>(schedule?.shiftCode || '');
  const [notes, setNotes] = useState(schedule?.notes || '');

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const isLoading =
    createSchedule.isPending || updateSchedule.isPending || deleteSchedule.isPending;

  const selectedShift = shiftTypes.find((s) => s.code === selectedCode);

  // Group shift types by category
  const groupedShifts = shiftTypes.reduce(
    (acc, shift) => {
      const cat = shift.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(shift);
      return acc;
    },
    {} as Record<string, ShiftType[]>
  );

  const categoryLabels: Record<string, string> = {
    standard: 'Standard',
    intermediate: 'Intermédiaire',
    night: 'Nuit',
    partial: 'Partiel',
    special: 'Spécial',
    rest: 'Repos',
    leave: 'Congés',
  };

  const handleSave = async () => {
    if (!selectedCode) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un type de service',
        variant: 'destructive',
      });
      return;
    }

    const shiftType = shiftTypes.find((s) => s.code === selectedCode);
    if (!shiftType) return;

    try {
      if (schedule?.id) {
        // Update existing
        await updateSchedule.mutateAsync({
          id: schedule.id,
          data: {
            shiftTypeId: shiftType.id,
            notes: notes || undefined,
          },
        });
        toast({
          title: 'Modifié',
          description: 'Le service a été mis à jour',
        });
      } else {
        // Create new
        await createSchedule.mutateAsync({
          userId,
          date,
          shiftTypeId: shiftType.id,
          notes: notes || undefined,
        });
        toast({
          title: 'Créé',
          description: 'Le service a été enregistré',
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite",
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;

    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast({
        title: 'Supprimé',
        description: 'Le service a été supprimé',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        variant: 'destructive',
      });
    }
  };

  const handleClear = () => {
    setSelectedCode('');
    setNotes('');
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Modifier' : 'Ajouter'} un service
          </DialogTitle>
          <DialogDescription>
            {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Shift Type Selection */}
          <div className="space-y-2">
            <Label>Type de service</Label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {Object.entries(groupedShifts).map(([category, shifts]) => (
                <div key={category}>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {categoryLabels[category] || category}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {shifts
                      .filter((s) => s.isActive)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((shift) => (
                        <button
                          key={shift.id}
                          type="button"
                          className={cn(
                            'px-2 py-1.5 text-xs font-medium rounded border transition-all',
                            'hover:ring-2 hover:ring-primary/50',
                            selectedCode === shift.code
                              ? 'ring-2 ring-primary border-primary'
                              : 'border-border'
                          )}
                          style={{
                            backgroundColor: `#${shift.colorHex}`,
                            color:
                              parseInt(shift.colorHex, 16) > 0x7fffff
                                ? '#000'
                                : '#fff',
                          }}
                          onClick={() => setSelectedCode(shift.code)}
                          title={shift.description}
                        >
                          {shift.code}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected shift details */}
          {selectedShift && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{selectedShift.code}</div>
              <div className="text-sm text-muted-foreground">
                {selectedShift.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-x-3">
                <span>Durée: {selectedShift.durationHours}h</span>
                <span>Nuit: {selectedShift.nightHours}h</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {schedule?.id && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {deleteSchedule.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Supprimer</span>
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClear} disabled={isLoading}>
            Effacer
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !selectedCode}>
            {(createSchedule.isPending || updateSchedule.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {schedule ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
