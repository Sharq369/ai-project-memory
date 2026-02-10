export default function DashPage() {
  const projects = [{ id: 1, name: "Alpha Project", files: 4 }, { id: 2, name: "Beta App", files: 12 }];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">+ New</button>
      </div>
      <div className="grid gap-4">
        {projects.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="font-bold">{p.name}</h2>
            <p className="text-sm text-slate-500">{p.files} files stored</p>
          </div>
        ))}
      </div>
    </div>
  );
}
