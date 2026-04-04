import { notFound } from 'next/navigation';
import { decodeHtml } from '@/lib/api';
import { getCachedCantina } from '@/lib/cantine';
import { getWinerySchema, getBreadcrumbSchema } from '@/lib/seo/schema';
import JsonLd from '@/components/JsonLd';
import CantineDetailClient from './CantineDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cantina = await getCachedCantina(slug);
  if (!cantina) return { title: 'Cantina non trovata' };

  const description = cantina.description
    ? decodeHtml(cantina.description).replace(/<[^>]*>/g, '').slice(0, 160)
    : `Scopri i vini di ${decodeHtml(cantina.name)} su Stappando. ${cantina.count} vini disponibili.`;

  const title = `${decodeHtml(cantina.name)} — Cantine Stappando`;
  const ogImage = cantina.banner || cantina.image;

  return {
    title,
    description,
    alternates: {
      canonical: `https://stappando.it/cantine/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, alt: decodeHtml(cantina.name) }] } : {}),
    },
  };
}

export default async function CantinaPage({ params }: Props) {
  const { slug } = await params;
  const cantina = await getCachedCantina(slug);
  if (!cantina) notFound();

  const winerySchema = getWinerySchema({
    name: decodeHtml(cantina.name),
    slug: cantina.slug,
    description: cantina.description,
    region: cantina.region,
    address: cantina.address,
    image: cantina.image,
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cantine', url: '/cantine' },
    { name: decodeHtml(cantina.name) },
  ]);

  return (
    <>
      <JsonLd data={winerySchema} />
      <JsonLd data={breadcrumbData} />
      <CantineDetailClient cantina={cantina} />
    </>
  );
}
