'use client';

import { useState, useEffect, useCallback } from 'react';

interface Preview {
  id: string;
  title: string;
  html: string;
}

export default function EmailPreviewPage() {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPreviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/email-preview');
      const data = await res.json();
      setPreviews(data.previews || []);
      if (data.previews?.length > 0) setSelected(data.previews[0].id);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPreviews(); }, [fetchPreviews]);

  const selectedPreview = previews.find(p => p.id === selected);

  if (loading && previews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#005667]/20 border-t-[#005667] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-sm font-bold text-[#005667] uppercase tracking-wider">Email Preview</h1>
          <p className="text-[11px] text-gray-400 mt-1">{previews.length} template</p>
        </div>
        <nav className="py-2">
          {previews.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left px-5 py-3 text-[13px] transition-colors border-l-2 ${
                selected === p.id
                  ? 'bg-[#005667]/5 border-[#005667] text-[#005667] font-semibold'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Preview area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedPreview ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedPreview.title}</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <iframe
                srcDoc={selectedPreview.html}
                title={selectedPreview.title}
                className="w-full border-0"
                style={{ height: '800px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Seleziona un template dalla sidebar
          </div>
        )}
      </main>
    </div>
  );
}
