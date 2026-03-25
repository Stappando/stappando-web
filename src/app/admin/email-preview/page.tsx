'use client';

import { useState, useEffect, useCallback } from 'react';

interface Preview {
  id: string;
  title: string;
  html: string;
}

export default function EmailPreviewPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPreviews = useCallback(async (pwd: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/email-preview?pwd=${encodeURIComponent(pwd)}`);
      if (res.status === 401) {
        setAuthed(false);
        setError('Password non valida');
        return;
      }
      const data = await res.json();
      setPreviews(data.previews || []);
      setAuthed(true);
      if (data.previews?.length > 0) setSelected(data.previews[0].id);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPreviews(password);
  };

  const selectedPreview = previews.find(p => p.id === selected);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4 text-[#005667]">Email Preview</h1>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm mb-3"
          />
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#005667] text-white rounded-lg font-semibold text-sm">
            {loading ? 'Caricamento...' : 'Accedi'}
          </button>
        </form>
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
