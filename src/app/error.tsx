"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-[34px] leading-tight">משהו השתבש בטעינה</h1>
      <p className="mt-2 text-muted">בדקו את החיבור לאינטרנט ונסו שוב.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-12 items-center rounded-full bg-cocoa px-6 font-semibold text-white hover:bg-cocoa-dark"
      >
        לנסות שוב
      </button>
    </div>
  );
}
