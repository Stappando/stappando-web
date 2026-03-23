import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, decodeHtml } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await api.getCategory(slug);
  if (!category) return { title: 'Categoria non trovata' };
  return {
    title: `${decodeHtml(category.name)} — Stappando`,
    description: `Scopri i vini della categoria ${decodeHtml(category.name)} su Stappando. ${category.count} prodotti disponibili.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);

  const category = await api.getCategory(slug);
  if (!category) notFound();

  const products = await api.getProducts({
    category: category.id,
    page,
    per_page: 20,
  });

  const totalPages = Math.ceil(category.count / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-brand-muted mb-6">
        <a href="/" className="hover:text-brand-primary">Home</a>
        <span className="mx-2">/</span>
        <span className="text-brand-text">{decodeHtml(category.name)}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">
          {decodeHtml(category.name)}
        </h1>
        <p className="text-sm text-brand-muted mt-1">{category.count} prodotti</p>
      </div>

      {/* Products */}
      <ProductGrid products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {page > 1 && (
            <Link
              href={`/categoria/${slug}?page=${page - 1}`}
              className="px-4 py-2 text-sm font-medium text-brand-primary border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
            >
              Precedente
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-brand-muted">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/categoria/${slug}?page=${page + 1}`}
              className="px-4 py-2 text-sm font-medium text-brand-primary border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
            >
              Successiva
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
