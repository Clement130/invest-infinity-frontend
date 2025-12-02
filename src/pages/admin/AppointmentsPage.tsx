import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  User, 
  Target,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
  Trash2,
  Edit3,
  Save,
  X,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAppointmentRequests,
  updateAppointmentStatus,
  deleteAppointmentRequest,
  getAppointmentStats,
} from '../../services/appointmentService';
import type { AppointmentRequest, AppointmentStatus } from '../../types/appointment';
import {
  appointmentStatusLabels,
  appointmentStatusColors,
  appointmentTypeLabels,
} from '../../types/appointment';
import { useToast } from '../../hooks/useToast';

export default function AppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<AppointmentStatus, number>>({
    pending: 0,
    contacted: 0,
    confirmed: 0,
    cancelled: 0,
  });
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal d'édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  
  // Modal de confirmation de suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, statsData] = await Promise.all([
        getAppointmentRequests(),
        getAppointmentStats(),
      ]);
      setAppointments(appointmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrer les appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Filtre par statut
    if (statusFilter !== 'all' && apt.status !== statusFilter) {
      return false;
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${apt.firstName} ${apt.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        apt.email.toLowerCase().includes(query) ||
        apt.phone.includes(query)
      );
    }
    
    return true;
  });

  // Changer le statut
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    const success = await updateAppointmentStatus(id, newStatus);
    if (success) {
      toast.success(`Statut mis à jour : ${appointmentStatusLabels[newStatus]}`);
      loadData();
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Sauvegarder les notes
  const handleSaveNotes = async (id: string) => {
    const success = await updateAppointmentStatus(id, appointments.find(a => a.id === id)?.status || 'pending', editNotes);
    if (success) {
      toast.success('Notes sauvegardées');
      setEditingId(null);
      loadData();
    } else {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Supprimer une demande
  const handleDelete = async (id: string) => {
    const success = await deleteAppointmentRequest(id);
    if (success) {
      toast.success('Demande supprimée');
      setDeletingId(null);
      loadData();
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Formater la date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-amber-400" />
            Demandes de Rendez-vous
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez les demandes de RDV pour le Bootcamp Élite
          </p>
        </div>
        
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(Object.entries(stats) as [AppointmentStatus, number][]).map(([status, count]) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${appointmentStatusColors[status]} cursor-pointer transition-all hover:scale-105`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <div className="text-3xl font-bold mb-1">{count}</div>
            <div className="text-sm opacity-80">{appointmentStatusLabels[status]}</div>
          </motion.div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        
        {/* Filtre par statut */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white hover:border-amber-500/50 transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-400" />
            <span>{statusFilter === 'all' ? 'Tous les statuts' : appointmentStatusLabels[statusFilter]}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 right-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden"
              >
                <button
                  onClick={() => { setStatusFilter('all'); setShowFilters(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors ${statusFilter === 'all' ? 'bg-amber-500/20 text-amber-400' : 'text-white'}`}
                >
                  Tous les statuts
                </button>
                {(Object.keys(appointmentStatusLabels) as AppointmentStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowFilters(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors ${statusFilter === status ? 'bg-amber-500/20 text-amber-400' : 'text-white'}`}
                  >
                    {appointmentStatusLabels[status]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Liste des demandes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucune demande de RDV'}
          </h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Essayez de modifier vos filtres'
              : 'Les demandes apparaîtront ici quand les clients utiliseront le chatbot'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden"
              >
                {/* Header de la carte */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {apt.firstName} {apt.lastName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(apt.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge statut + Offre */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Crown className="w-3 h-3" />
                      {apt.offerName}
                    </span>
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${appointmentStatusColors[apt.status]} bg-transparent`}
                    >
                      {(Object.keys(appointmentStatusLabels) as AppointmentStatus[]).map((status) => (
                        <option key={status} value={status} className="bg-slate-800 text-white">
                          {appointmentStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Contact */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</h4>
                    <div className="space-y-1.5">
                      <a 
                        href={`mailto:${apt.email}`}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-400 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-gray-500" />
                        {apt.email}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                      <a 
                        href={`tel:${apt.phone}`}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-400 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-gray-500" />
                        {apt.phone}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                      {apt.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {apt.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Détails RDV */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rendez-vous</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        {appointmentTypeLabels[apt.type] || apt.type}
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="line-clamp-2">{apt.availability}</span>
                      </div>
                    </div>
                  </div>

                  {/* Objectifs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Objectifs</h4>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <Target className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="line-clamp-3">{apt.goals || 'Non précisé'}</span>
                    </div>
                  </div>
                </div>

                {/* Notes admin */}
                <div className="px-4 pb-4">
                  {editingId === apt.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes internes (visibles uniquement par les admins)..."
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </button>
                        <button
                          onClick={() => handleSaveNotes(apt.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {apt.adminNotes ? (
                          <p className="text-sm text-gray-400 italic">
                            📝 {apt.adminNotes}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 italic">
                            Aucune note
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingId(apt.id); setEditNotes(apt.adminNotes || ''); }}
                          className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Modifier les notes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(apt.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-t border-slate-700/50">
                  <button
                    onClick={() => handleStatusChange(apt.id, 'contacted')}
                    disabled={apt.status === 'contacted'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Marquer contacté
                  </button>
                  <button
                    onClick={() => handleStatusChange(apt.id, 'confirmed')}
                    disabled={apt.status === 'confirmed'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmer RDV
                  </button>
                  <button
                    onClick={() => handleStatusChange(apt.id, 'cancelled')}
                    disabled={apt.status === 'cancelled'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Annuler
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Confirmer la suppression</h3>
                  <p className="text-sm text-gray-400">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer cette demande de rendez-vous ? 
                Toutes les données associées seront perdues.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}







