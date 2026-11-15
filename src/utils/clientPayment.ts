/**
 * FleetIQ 13 – paiement et blocage d'un client : une seule règle pour Packs et Gestion Clients (mock FleetStore).
 * - Valider le paiement : nouvelle date d'expiration obligatoire (postérieure à aujourd'hui) ; le client redevient
 *   actif, blockedAt / blockReason sont effacés et l'échéance des packs affectés suit la nouvelle date.
 * - Bloquer : blockedAt = aujourd'hui, motif choisi (paiement par défaut).
 * Droits (backofficePermissions) : Admin et Finance seulement (Q2, 15/11/2026). En production : règle appliquée par l'API.
 */
import type { FleetClient } from '../state/FleetStore';

export type BlockReason = NonNullable<FleetClient['blockReason']>;

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  paiement: 'Paiement non reçu',
  expiré: 'Abonnement expiré'
};

/** Message d'erreur en français, ou null si la date permet de valider le paiement. */
export function validatePaymentExpiry(newExpiry: string, todayIso: string): string | null {
  if (!newExpiry) return "Choisissez la nouvelle date d'expiration pour valider le paiement.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiry)) return "La date d'expiration n'est pas valide.";
  if (newExpiry <= todayIso) return "La nouvelle date d'expiration doit être postérieure à aujourd'hui.";
  return null;
}

export function applyPaymentValidation(c: FleetClient, newExpiry: string): FleetClient {
  return {
    ...c,
    expiry: newExpiry,
    status: 'Active',
    blockedAt: null,
    blockReason: null,
    packs: c.packs.map((a) => ({ ...a, expiresAt: newExpiry }))
  };
}

export function applyClientBlock(c: FleetClient, todayIso: string, reason: BlockReason = 'paiement'): FleetClient {
  return { ...c, status: 'Blocked', blockedAt: todayIso, blockReason: reason };
}
