import { PlayCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import tutorialPoster from "@/assets/tutorial-acesso-poster.jpg.asset.json";
import tutorialVideo from "@/assets/tutorial-acesso.mp4.asset.json";

/**
 * Painel visível na tela de login que abre o vídeo passo a passo de acesso.
 */
export function AccessTutorial() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-6 flex w-full items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <PlayCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-primary">
              Tem dificuldade para entrar?
            </span>
            <span className="block text-xs text-muted-foreground">
              Assista o passo a passo de como acessar (1min23)
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Como acessar sua área de membros
          </DialogTitle>
        </DialogHeader>
        <video
          src={tutorialVideo.url}
          poster={tutorialPoster.url}
          controls
          playsInline
          preload="metadata"
          className="mx-auto max-h-[62vh] w-full rounded-lg bg-black object-contain"
        />
        <p className="text-xs text-muted-foreground">
          Ainda com dificuldade? Chame no WhatsApp (13) 99692-7284 ou envie um e-mail para
          mirianmariasantarossa@gmail.com.
        </p>
      </DialogContent>
    </Dialog>
  );
}
