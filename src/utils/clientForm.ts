/**
 * FleetIQ 13 – formulaire « Ajouter / Modifier un client » de Gestion Clients (mock FleetStore).
 * Validation en français ; le mot de passe est contrôlé mais jamais enregistré (aucun mot de passe dans les données,
 * décision FleetIQ 06). En production : validation refaite par l'API.
 */
import type { FleetClient, FleetEquipment, Intervention, SimCard } from '../state/FleetStore';

export type ClientForm = {
  name: string;
  expiry: string;
  website: string;
  timezone: string;
  address: string;
  tel: string;
  email: string;
  tel2: string;
  email2: string;
  vehicleUnlimited: boolean;
  vehicleLimit: string;
  accountUnlimited: boolean;
  accountLimit: string;
  username: string;
  password: string;
  password2: string;
};

export function emptyClientForm(): ClientForm {
  return {
    name: '',
    expiry: '',
    website: '',
    timezone: 'UTC+1',
    address: '',
    tel: '',
    email: '',
    tel2: '',
    email2: '',
    vehicleUnlimited: false,
    vehicleLimit: '',
    accountUnlimited: false,
    accountLimit: '',
    username: '',
    password: '',
    password2: ''
  };
}

export type ClientFormError = { step: number; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPositiveInt(v: string): boolean {
  return /^\d+$/.test(v.trim()) && parseInt(v, 10) > 0;
}

/** Première erreur du formulaire (étape à afficher + message), ou null. */
export function validateClientForm(
  form: ClientForm,
  opts: {
    isNew: boolean;
    clientType: 'Simple' | 'Revendeur';
    editingId: number | null;
    clients: FleetClient[];
    todayIso: string;
  }
): ClientFormError | null {
  const name = form.name.trim();
  if (!name) return { step: 1, message: 'Le nom du client est obligatoire.' };
  if (name.length > 80) return { step: 1, message: 'Le nom du client ne doit pas dépasser 80 caractères.' };
  if (name.endsWith('_Stock') || name.toLowerCase() === 'tunav') {
    return { step: 1, message: 'Ce nom est réservé (stock ou entité Tunav).' };
  }
  const lower = name.toLowerCase();
  if (opts.clients.some((c) => c.id !== opts.editingId && c.name.trim().toLowerCase() === lower)) {
    return { step: 1, message: 'Un client porte déjà ce nom.' };
  }
  if (!form.expiry) return { step: 1, message: "La date d'expiration est obligatoire." };
  if (!DATE_RE.test(form.expiry)) return { step: 1, message: "La date d'expiration n'est pas valide." };
  if (opts.isNew && form.expiry <= opts.todayIso) {
    return { step: 1, message: "La date d'expiration d'un nouveau client doit être postérieure à aujourd'hui." };
  }
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
    return { step: 2, message: "L'adresse e-mail 1 n'est pas valide." };
  }
  if (form.email2.trim() && !EMAIL_RE.test(form.email2.trim())) {
    return { step: 2, message: "L'adresse e-mail 2 n'est pas valide." };
  }
  if (opts.clientType === 'Simple') {
    if (!form.vehicleUnlimited && !isPositiveInt(form.vehicleLimit)) {
      return { step: 3, message: 'Saisissez le nombre de véhicules autorisé (nombre entier supérieur à 0) ou choisissez « illimité ».' };
    }
    if (!form.accountUnlimited && !isPositiveInt(form.accountLimit)) {
      return { step: 3, message: 'Saisissez le nombre de comptes autorisé (nombre entier supérieur à 0) ou choisissez « illimité ».' };
    }
  }
  if (form.password || form.password2) {
    if (form.password.length < 8) return { step: 4, message: 'Le mot de passe doit contenir au moins 8 caractères.' };
    if (form.password !== form.password2) return { step: 4, message: 'Les deux mots de passe ne sont pas identiques.' };
  }
  return null;
}

/**
 * Renommer un client : les équipements, puces et interventions désignent le client (et le revendeur) par son nom ;
 * on suit le nouveau nom partout, stock du revendeur compris (« <nom>_Stock »).
 */
export function renameClientReferences(oldName: string, newName: string) {
  const map = (n: string) => (n === oldName ? newName : n === `${oldName}_Stock` ? `${newName}_Stock` : n);
  return {
    clients: (list: FleetClient[]) =>
      list.map((c) => (c.reseller === oldName || c.name === `${oldName}_Stock` ? { ...c, name: map(c.name), reseller: map(c.reseller) } : c)),
    equipments: (list: FleetEquipment[]) =>
      list.map((e) => (e.client === oldName || e.reseller === oldName || e.client === `${oldName}_Stock` ? { ...e, client: map(e.client), reseller: map(e.reseller) } : e)),
    simCards: (list: SimCard[]) =>
      list.map((s) => (s.client === oldName || s.reseller === oldName || s.client === `${oldName}_Stock` ? { ...s, client: map(s.client), reseller: map(s.reseller) } : s)),
    interventions: (list: Intervention[]) =>
      list.map((i) => (i.client === oldName || i.reseller === oldName ? { ...i, client: map(i.client), reseller: map(i.reseller) } : i))
  };
}
