import type { Metadata } from 'next';
import HomepageV2Client from './HomepageV2Client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default function HomepageV2Page() {
  return <HomepageV2Client />;
}
