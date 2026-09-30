import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shifa — AI Care Coordinator',
  description:
    'From "I don\'t feel well" to "medicine at my door" — Shifa coordinates your healthcare journey.',
};

// Root layout — no locale here; [locale] layout handles i18n
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
