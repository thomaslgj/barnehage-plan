'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/nb';

dayjs.extend(relativeTime);
dayjs.locale('nb');

interface GDPRRequest {
  id: string;
  user_email: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  requested_at: string;
  completed_at?: string;
  user_notes?: string;
  admin_notes?: string;
  user_id?: string;
  household_id?: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  access: 'Innsyn i data',
  rectification: 'Retting av data',
  erasure: 'Sletting av konto',
  restriction: 'Begrensning',
  portability: 'Data eksport',
  objection: 'Innsigelse',
};

export default function GDPRRequests({ requests }: { requests: GDPRRequest[] }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled');

  const handleExportData = async (requestId: string, userEmail: string) => {
    if (!confirm(`Eksportere data for ${userEmail}?\n\nDette vil generere en JSON-fil med all brukerens data.`)) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/gdpr/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${userEmail}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Data eksportert! Send filen til brukeren via e-post.');
    } catch (error) {
      alert('Feil ved eksport av data');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (requestId: string, userEmail: string) => {
    const notes = prompt(`Marker forespørsel som fullført.\n\nLegg til notater (valgfritt):`);
    if (notes === null) return; // User cancelled

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/gdpr/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, adminNotes: notes }),
      });

      if (!response.ok) throw new Error('Failed to complete');

      window.location.reload();
    } catch (error) {
      alert('Feil ved fullføring av forespørsel');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, userEmail: string) => {
    const reason = prompt(`Avvis forespørsel fra ${userEmail}.\n\nBegrunnelse (påkrevd):`);
    if (!reason || !reason.trim()) return;

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/gdpr/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      window.location.reload();
    } catch (error) {
      alert('Feil ved avvisning av forespørsel');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteAccount = async (requestId: string, userEmail: string, userId?: string) => {
    if (!userId) {
      alert('Kan ikke slette: Bruker-ID mangler');
      return;
    }

    if (!confirm(
      `⚠️ ADVARSEL: Slette konto for ${userEmail}?\n\n` +
      `Dette vil PERMANENT slette:\n` +
      `- Brukerkonto\n` +
      `- Hushold (hvis eneste medlem)\n` +
      `- Alle data (schedule, notater, etc.)\n\n` +
      `Skriv "DELETE" for å bekrefte:`
    )) {
      return;
    }

    const confirmation = prompt('Skriv "DELETE" for å bekrefte:');
    if (confirmation !== 'DELETE') return;

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/gdpr/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      alert('Konto slettet! Forespørselen er markert som fullført.');
      window.location.reload();
    } catch (error: any) {
      alert(`Feil ved sletting: ${error.message}`);
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const getDaysWaiting = (requestedAt: string) => {
    const days = dayjs().diff(dayjs(requestedAt), 'days');
    return days;
  };

  const getUrgencyColor = (days: number) => {
    if (days > 25) return 'bg-card border-error';
    if (days > 20) return 'bg-card border-warning';
    return 'bg-card-elevated border-border';
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-light">Ingen GDPR-forespørsler ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Ventende forespørsler ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const daysWaiting = getDaysWaiting(request.requested_at);
              return (
                <div
                  key={request.id}
                  className={`border rounded-lg p-6 ${getUrgencyColor(daysWaiting)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-foreground font-medium">{request.user_email}</h4>
                      <p className="text-sm text-muted mt-1">
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-light">
                        {dayjs(request.requested_at).fromNow()}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${
                        daysWaiting > 25 ? 'text-error' :
                        daysWaiting > 20 ? 'text-warning' :
                        'text-light'
                      }`}>
                        {daysWaiting} {daysWaiting === 1 ? 'dag' : 'dager'}
                      </p>
                    </div>
                  </div>

                  {request.user_notes && (
                    <div className="mb-4 p-3 bg-card rounded border border-border">
                      <p className="text-xs text-light mb-1">Brukerens notater:</p>
                      <p className="text-sm text-foreground">{request.user_notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {request.request_type === 'access' || request.request_type === 'portability' ? (
                      <>
                        <button
                          onClick={() => handleExportData(request.id, request.user_email)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-primary-light hover:bg-primary text-white text-sm rounded disabled:opacity-50"
                        >
                          📄 Eksporter data
                        </button>
                        <button
                          onClick={() => handleComplete(request.id, request.user_email)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-primary-light hover:bg-primary text-white text-sm rounded disabled:opacity-50"
                        >
                          ✅ Marker fullført
                        </button>
                      </>
                    ) : request.request_type === 'erasure' ? (
                      <>
                        <button
                          onClick={() => handleDeleteAccount(request.id, request.user_email, request.user_id)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-error hover:bg-error/90 text-white text-sm rounded disabled:opacity-50"
                        >
                          🗑️ Slett konto
                        </button>
                        <button
                          onClick={() => handleComplete(request.id, request.user_email)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-primary-light hover:bg-primary text-white text-sm rounded disabled:opacity-50"
                        >
                          ✅ Marker fullført
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleComplete(request.id, request.user_email)}
                        disabled={processing === request.id}
                        className="px-4 py-2 bg-primary-light hover:bg-primary text-white text-sm rounded disabled:opacity-50"
                      >
                        ✅ Marker fullført
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(request.id, request.user_email)}
                      disabled={processing === request.id}
                      className="px-4 py-2 bg-border-light hover:bg-border text-white text-sm rounded disabled:opacity-50"
                    >
                      ❌ Avvis
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-light hover:text-muted text-sm"
          >
            {showCompleted ? '▼' : '▶'} Vis fullførte forespørsler ({completedRequests.length})
          </button>

          {showCompleted && (
            <div className="mt-4 space-y-3">
              {completedRequests.map((request) => (
                <div key={request.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{request.user_email}</h4>
                      <p className="text-sm text-muted mt-1">
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        request.status === 'completed' ? 'text-primary-light' :
                        request.status === 'rejected' ? 'text-error' :
                        'text-light'
                      }`}>
                        {request.status === 'completed' ? 'Fullført' :
                         request.status === 'rejected' ? 'Avvist' :
                         'Kansellert'}
                      </p>
                      <p className="text-xs text-light mt-1">
                        {dayjs(request.completed_at).fromNow()}
                      </p>
                    </div>
                  </div>
                  {request.admin_notes && (
                    <p className="text-xs text-light mt-2">Notater: {request.admin_notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
