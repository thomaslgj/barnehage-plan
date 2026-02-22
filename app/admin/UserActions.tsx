'use client';

import { useState } from 'react';
import { resendInvite, deleteUser, togglePremium } from './actions';

interface UserActionsProps {
  memberId: string;
  userId: string | null;
  hasAccount: boolean;
  displayName: string;
  isPremium: boolean;
}

export default function UserActions({ memberId, userId, hasAccount, displayName, isPremium }: UserActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleResendInvite = async () => {
    if (!confirm(`Send ny invitasjon til ${displayName}?`)) return;

    setLoading(true);
    try {
      const result = await resendInvite(memberId);
      if (result.success) {
        alert('Invitasjon sendt!');
      } else {
        alert(`Feil: ${result.error}`);
      }
    } catch (error) {
      alert('Kunne ikke sende invitasjon');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Er du sikker på at du vil slette ${displayName}? Dette kan ikke angres.`)) return;
    if (!confirm('Er du helt sikker? Alle data vil bli slettet.')) return;

    setLoading(true);
    try {
      const result = await deleteUser(memberId, userId);
      if (result.success) {
        alert('Bruker slettet!');
        window.location.reload();
      } else {
        alert(`Feil: ${result.error}`);
      }
    } catch (error) {
      alert('Kunne ikke slette bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePremium = async () => {
    const action = isPremium ? 'fjerne premium fra' : 'oppgradere';
    if (!confirm(`Er du sikker på at du vil ${action} ${displayName}?`)) return;

    setLoading(true);
    try {
      const result = await togglePremium(memberId, !isPremium);
      if (result.success) {
        alert(isPremium ? 'Premium fjernet!' : 'Oppgradert til premium!');
        window.location.reload();
      } else {
        alert(`Feil: ${result.error}`);
      }
    } catch (error) {
      alert('Kunne ikke endre premium status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {!hasAccount && (
        <button
          onClick={handleResendInvite}
          disabled={loading}
          style={{
            color: loading ? '#9ca3af' : '#2563eb',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.color = '#1d4ed8')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.color = '#2563eb')}
        >
          Send invitasjon
        </button>
      )}
      {hasAccount && (
        <button
          onClick={handleTogglePremium}
          disabled={loading}
          style={{
            color: loading ? '#9ca3af' : (isPremium ? '#92400e' : '#059669'),
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.color = isPremium ? '#78350f' : '#047857')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.color = isPremium ? '#92400e' : '#059669')}
        >
          {isPremium ? '⭐ Fjern premium' : '⭐ Oppgrader'}
        </button>
      )}
      <button
        onClick={handleDeleteUser}
        disabled={loading}
        style={{
          color: loading ? '#9ca3af' : '#dc2626',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.color = '#b91c1c')}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.color = '#dc2626')}
      >
        Slett
      </button>
    </div>
  );
}
