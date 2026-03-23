import type { Metadata } from 'next';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Il Mio Account — Stappando',
  description: 'Accedi al tuo account Stappando per gestire ordini, indirizzi, punti POP e preferiti.',
};

export default function AccountPage() {
  return <AccountClient />;
}
