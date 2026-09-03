import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isStandalone } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS/Safari não dispara beforeinstallprompt: mostramos instrução manual.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
    if (isIos && isSafari) setShowIosHint(true);

    const onInstalled = () => {
      setPromptEvent(null);
      setShowIosHint(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* armazenamento indisponível */
    }
    setPromptEvent(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "dismissed") dismiss();
    setPromptEvent(null);
  }

  if (!promptEvent && !showIosHint) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-20 z-50 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm md:bottom-5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-label="Instalar aplicativo"
    >
      <button
        onClick={dismiss}
        aria-label="Dispensar convite de instalação"
        className="absolute right-2 top-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 font-serif text-lg text-primary">Instalar o aplicativo</p>
      {promptEvent ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse suas aulas direto da tela inicial, como um app.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="lg" className="flex-1" onClick={install}>
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button size="lg" variant="ghost" onClick={dismiss}>
              Agora não
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
          <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            No iPhone: toque em <strong>Compartilhar</strong> e escolha{" "}
            <strong>Adicionar à Tela de Início</strong>.
          </span>
        </p>
      )}
    </div>
  );
}
