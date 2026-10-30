function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#1877F2"
        d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.5V4.3c-.3 0-1.3-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v2.5H8v3h2.5V21h3z"
      />
    </svg>
  )
}

export function SocialButtons() {
  const base =
    "flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#3a2217] text-xs font-bold text-text-soft opacity-80 md:h-10 md:rounded md:text-[13px]"
  return (
    <div className="mt-8 grid gap-3 md:mt-6">
      <div className="flex items-center gap-3 text-xs md:-mx-20 md:text-[13px]">
        <span className="h-px flex-1 bg-[#3a2217]" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-[#3a2217]" />
      </div>
      <button type="button" disabled title="Em breve" className={base}>
        <GoogleIcon />
        Continuar com Google
      </button>
      <button type="button" disabled title="Em breve" className={base}>
        <FacebookIcon />
        Continuar com Facebook
      </button>
    </div>
  )
}