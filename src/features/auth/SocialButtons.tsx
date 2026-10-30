export function SocialButtons() {
  const base =
    "flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#3a2217] text-xs font-bold text-text-soft opacity-80";
  return (
    <div className="mt-8 grid gap-3 md:hidden">
      <div className="flex items-center gap-3 text-xs">
        <span className="h-px flex-1 bg-[#3a2217]" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-[#3a2217]" />
      </div>
      <button type="button" disabled title="Em breve" className={base}>
        <span aria-hidden="true" className="text-lg font-bold text-[#4285F4]">
          G
        </span>
        Continuar com Google
      </button>
      <button type="button" disabled title="Em breve" className={base}>
        <span aria-hidden="true" className="text-lg font-bold text-[#1877F2]">
          f
        </span>
        Continuar com Facebook
      </button>
    </div>
  );
}
