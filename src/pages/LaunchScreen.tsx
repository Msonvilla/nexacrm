export default function LaunchScreen() {
  return (
    <main
      className="launch-screen relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="launch-glow launch-glow-one" aria-hidden="true" />
      <div className="launch-glow launch-glow-two" aria-hidden="true" />

      <div className="launch-content relative z-10 flex flex-col items-center text-center">
        <div className="launch-logo-wrap mb-7">
          <div className="launch-logo-halo" aria-hidden="true" />
          <img
            src="/nexa-crm-mark.svg"
            alt="Nexa CRM"
            className="launch-logo relative h-24 w-24"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
          Nexa CRM
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your business, in sync.
        </h1>
        <p className="mt-3 text-sm text-slate-400">Preparing your workspace</p>
        <div className="launch-progress mt-8 h-1 w-40 overflow-hidden rounded-full bg-slate-800">
          <div className="launch-progress-bar h-full rounded-full bg-sky-400" />
        </div>
      </div>
    </main>
  );
}
