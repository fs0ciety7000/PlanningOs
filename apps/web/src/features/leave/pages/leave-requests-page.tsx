// Leave Requests Page - Agents create, planners validate

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Check,
  X,
  Clock,
  Calendar,
  User,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAuthStore } from '@/stores/auth-store';
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useShiftTypes,
} from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { LeaveRequest, LeaveType } from '@/types/api';

const LEAVE_TYPES: { value: LeaveType; label: string; description: string }[] = [
  { value: 'CN', label: 'Congé Normalisé (CN)', description: 'Congé annuel standard' },
  { value: 'JC', label: 'Jour de Compensation (JC)', description: 'Jour de récupération' },
  { value: 'CV', label: 'Congé Ancienneté (CV)', description: '1 par période max' },
  { value: 'AM', label: 'Arrêt Maladie (AM)', description: 'Sur justificatif médical' },
];

export function LeaveRequestsPage() {
  const { user, isPlanner, isAdmin } = useAuthStore();
  const canValidate = isPlanner() || isAdmin();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    leaveType: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Query for leave requests - agents see their own, planners see all
  const query = canValidate
    ? statusFilter !== 'all' ? { status: statusFilter as 'pending' | 'approved' | 'rejected' } : undefined
    : { userId: user?.id };

  const { data: leaveRequests = [], isLoading, refetch } = useLeaveRequests(query);
  const { data: shiftTypes = [] } = useShiftTypes();

  const createMutation = useCreateLeaveRequest({
    onSuccess: () => {
      toast({ title: 'Demande envoyée', description: 'Votre demande de congé a été soumise.' });
      setIsCreateOpen(false);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const approveMutation = useApproveLeaveRequest({
    onSuccess: () => {
      toast({ title: 'Demande traitée', description: 'La demande a été mise à jour.' });
      setSelectedRequest(null);
      setRejectReason('');
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason || undefined,
    });
  };

  const handleApprove = (request: LeaveRequest) => {
    approveMutation.mutate({
      id: request.id,
      data: { approved: true },
    });
  };

  const handleReject = (request: LeaveRequest) => {
    if (!rejectReason.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez indiquer un motif de refus.', variant: 'destructive' });
      return;
    }
    approveMutation.mutate({
      id: request.id,
      data: { approved: false, rejectionReason: rejectReason },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Check className="h-3 w-3" />
            Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <X className="h-3 w-3" />
            Refusé
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demandes de Congés</h1>
          <p className="text-muted-foreground">
            {canValidate
              ? 'Gérez et validez les demandes de congés des agents'
              : 'Consultez et créez vos demandes de congés'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canValidate && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Create button - only for agents */}
          {!canValidate && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Demande
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Demande de Congé</DialogTitle>
                  <DialogDescription>
                    Remplissez le formulaire pour soumettre votre demande.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Type de congé *</Label>
                    <Select
                      value={formData.leaveType}
                      onValueChange={(v) => setFormData((f) => ({ ...f, leaveType: v as LeaveType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAVE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                        min={formData.startDate}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motif (optionnel)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Indiquez un motif si nécessaire..."
                      value={formData.reason}
                      onChange={(e) => setFormData((f) => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Envoi...' : 'Soumettre'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats for planners */}
      {canValidate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                  {leaveRequests.filter((r) => r.status === 'pending').length}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {leaveRequests.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">Approuvés</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <X className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                  {leaveRequests.filter((r) => r.status === 'rejected').length}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">Refusés</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave requests list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : leaveRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune demande de congé</p>
            {!canValidate && (
              <p className="text-sm mt-2">
                Cliquez sur "Nouvelle Demande" pour créer votre première demande.
              </p>
            )}
          </div>
        ) : (
          leaveRequests.map((request) => (
            <div
              key={request.id}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <span className="font-medium">
                      {LEAVE_TYPES.find((t) => t.value === request.leaveType)?.label || request.leaveType}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </span>
                    {canValidate && request.user && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.user.firstName} {request.user.lastName}
                      </span>
                    )}
                  </div>

                  {request.reason && (
                    <div className="flex items-start gap-1 text-sm">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{request.reason}</span>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-700 dark:text-red-300">
                      <strong>Motif du refus:</strong> {request.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action buttons for planners on pending requests */}
                {canValidate && request.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Refuser la demande</DialogTitle>
                          <DialogDescription>
                            Veuillez indiquer le motif du refus.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Textarea
                            placeholder="Motif du refus..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                            Annuler
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => selectedRequest && handleReject(selectedRequest)}
                            disabled={approveMutation.isPending}
                          >
                            Confirmer le refus
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
