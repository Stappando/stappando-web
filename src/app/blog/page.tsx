import Link from 'next/link';
import Image from 'next/image';
import { api, decodeHtml } from '@/lib/api';

export const metadata = {
  title: 'Blog — Stappando',
  description: 'Articoli, guide e consigli sul mondo del vino italiano. Il blog di Stappando.',
};

export default async function BlogPage() {
  const posts = await api.getPosts(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-8">Il Blog di Stappando</h1>

      {posts.length === 0 ? (
        <p className="text-brand-muted text-center py-16">Nessun articolo trovato.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[16/10] bg-brand-bg">
                  {featuredImage ? (
                    <Image
                      src={featuredImage}
                      alt={decodeHtml(post.title.rendered)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-brand-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <time className="text-xs text-brand-muted">
                    {new Date(post.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                  <h2 className="text-base font-bold text-brand-text mt-1 line-clamp-2 group-hover:text-brand-primary transition-colors">
                    {decodeHtml(post.title.rendered)}
                  </h2>
                  <p className="text-sm text-brand-muted mt-2 line-clamp-3">
                    {decodeHtml(post.excerpt.rendered)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
