'use client';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  // Mock data - we will replace this with Supabase data later
  const files = [
    { name: 'schema.sql', size: '2kb', type: 'SQL' },
    { name: 'api-routes.md', size: '15kb', type: 'Markdown' }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">Project #{params.id}</h1>
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Active</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between">
          <span className="text-sm font-semibold">Files for AI Memory</span>
          <button className="text-blue-600 text-sm font-bold">+ Upload</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {files.map((file) => (
            <div key={file.name} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-400">{file.size} • {file.type}</p>
              </div>
              <button className="text-slate-400 hover:text-red-500">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
