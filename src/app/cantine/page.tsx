import type { Metadata } from 'next';
import CantineClient from './CantineClient';

export const metadata: Metadata = {
  title: 'Cantine — Stappando',
  description: 'Scopri le cantine italiane selezionate da Stappando. Vini d\'eccellenza direttamente dal produttore.',
};

export default function CantinePage() {
  return <CantineClient />;
}
