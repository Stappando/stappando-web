import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api, decodeHtml } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await api.getPost(slug);
  if (!post) return { title: 'Articolo non trovato' };
  return {
    title: `${decodeHtml(post.title.rendered)} — Stappando Blog`,
    description: decodeHtml(post.excerpt.rendered).slice(0, 160),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await api.getPost(slug);
  if (!post) notFound();

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-brand-muted mb-6">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-brand-primary">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-brand-text line-clamp-1">{decodeHtml(post.title.rendered)}</span>
      </nav>

      {/* Date */}
      <time className="text-sm text-brand-muted">
        {new Date(post.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
      </time>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-text mt-2 mb-6">
        {decodeHtml(post.title.rendered)}
      </h1>

      {/* Featured image */}
      {featuredImage && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <Image
            src={featuredImage}
            alt={decodeHtml(post.title.rendered)}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="wp-content text-brand-text/80"
        dangerouslySetInnerHTML={{ __html: post.content.rendered }}
      />

      {/* Back */}
      <div className="mt-10 pt-6 border-t border-brand-border">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Torna al blog
        </Link>
      </div>
    </article>
  );
}
