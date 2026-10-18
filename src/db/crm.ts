import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { PARTICIPANTS } from './seed';

export interface CrmContact {
  id: string;
  externalId: string;
  name: string;
  role: string;
  createdAt: number;
}

export class CrmDatabase extends Dexie {
  contacts!: Table<CrmContact, string>;

  constructor() {
    super('AppCRMDB');
    this.version(1).stores({
      contacts: 'id, externalId, name',
    });
  }
}

export const crm = new CrmDatabase();

let crmSeeded = false;

export async function ensureCrmSeeded(): Promise<void> {
  if (crmSeeded) return;
  crmSeeded = true;
  const any = await crm.contacts.limit(1).toArray();
  if (any.length === 0) {
    const now = Date.now();
    await crm.contacts.bulkPut(
      PARTICIPANTS.map((p) => ({
        id: crypto.randomUUID(),
        externalId: p.id,
        name: p.name,
        role: p.role,
        createdAt: now,
      }))
    );
  }
}

export function useContacts(): CrmContact[] {
  const contacts = useLiveQuery(() => crm.contacts.toArray(), []);
  return contacts ?? PARTICIPANTS.map((p) => ({ id: p.id, externalId: p.id, name: p.name, role: p.role, createdAt: 0 }));
}

export function useContactByExternalId(externalId: string): CrmContact | undefined {
  return useLiveQuery(async () => {
    const found = await crm.contacts.where('externalId').equals(externalId).first();
    return found;
  }, [externalId]);
}
