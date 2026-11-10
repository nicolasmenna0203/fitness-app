import type { Metadata } from "next";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-[340px] flex-col items-center gap-6">
        <span className="flex size-[72px] items-center justify-center rounded-[18px] bg-accent text-on-accent">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <circle cx="12" cy="12" r="7.5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        <h1 className="text-[28px] font-bold tracking-tight">Fitness</h1>
        <FormLogin />
      </div>
    </main>
  );
}
