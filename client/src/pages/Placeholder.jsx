export default function Placeholder({ title, children }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-600 mt-2 text-sm">
        {children || 'Use the API from this screen or extend the UI. Core flows are wired on the dashboard.'}
      </p>
    </div>
  );
}
