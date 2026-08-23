"use client";

export type Ekran = "harita" | "akis" | "ara" | "profil";

const IKON: Record<Ekran, React.ReactNode> = {
  harita: <path d="M9 4 3 6.4v13.2L9 17.2l6 2.4 6-2.4V4l-6 2.4zM9 4v13.2M15 6.4v13.2" />,
  akis: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="1.6" />
      <rect x="3.5" y="14" width="17" height="6" rx="1.6" />
    </>
  ),
  ara: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.2 16.2 21 21" />
    </>
  ),
  profil: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </>
  ),
};

const AD: Record<Ekran, string> = { harita: "Harita", akis: "Akış", ara: "Ara", profil: "Profil" };

export default function AltMenu({
  ekran,
  onGec,
  onPinAt,
}: {
  ekran: Ekran;
  onGec: (e: Ekran) => void;
  onPinAt: () => void;
}) {
  const dugme = (e: Ekran) => (
    <button
      key={e}
      onClick={() => onGec(e)}
      aria-current={ekran === e ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-[3px] border-none bg-transparent py-1.5 font-tabela text-[9.5px] uppercase tracking-[0.11em] ${
        ekran === e ? "text-jeton" : "text-[rgba(35,52,60,.45)]"
      }`}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {IKON[e]}
      </svg>
      {AD[e]}
    </button>
  );

  return (
    <nav className="flex shrink-0 items-center border-t border-[var(--cizgi)] bg-yuzey px-1.5 py-1.5">
      {dugme("harita")}
      {dugme("akis")}
      <button
        onClick={onPinAt}
        aria-label="Pin at"
        className="mx-1.5 grid size-11 shrink-0 place-items-center rounded-full border-none bg-jeton shadow-[0_4px_14px_rgba(184,128,26,.35)]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {dugme("ara")}
      {dugme("profil")}
    </nav>
  );
}
