import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte ao aluno — Método Mirian Serrano" },
      {
        name: "description",
        content: "Fale com a equipe do Método Mirian Serrano e veja as dúvidas mais frequentes.",
      },
      { property: "og:title", content: "Suporte ao aluno — Método Mirian Serrano" },
      { property: "og:description", content: "Atendimento e dúvidas frequentes do curso." },
    ],
  }),
  component: SupportPage,
});

const faq = [
  {
    question: "Por quanto tempo tenho acesso às aulas?",
    answer:
      "Seu acesso segue as condições da sua compra. Enquanto estiver ativo, você assiste quantas vezes quiser, no seu ritmo.",
  },
  {
    question: "O vídeo de uma aula não abriu. O que faço?",
    answer:
      "Atualize a página e verifique sua conexão. Se continuar, fale com o suporte informando o módulo e o nome da aula.",
  },
  {
    question: "Como imprimo os moldes corretamente?",
    answer:
      "Na área de Materiais, baixe o molde em PDF e imprima em escala 100% (sem 'ajustar à página'). Confira o quadrado de teste antes de cortar.",
  },
  {
    question: "As aulas marcadas como 'em breve' já estão inclusas?",
    answer:
      "Sim. Assim que gravadas, aparecem automaticamente na sua área de membros, sem custo extra.",
  },
];

function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl text-primary">Suporte</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Estamos por aqui para ajudar com aulas, moldes e acesso.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <MessageCircle className="h-5 w-5 text-gold" />
            <CardTitle className="font-serif text-lg">WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                Falar agora
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Mail className="h-5 w-5 text-gold" />
            <CardTitle className="font-serif text-lg">E-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:contato@metodomirianserrano.com">Enviar e-mail</a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Instagram className="h-5 w-5 text-gold" />
            <CardTitle className="font-serif text-lg">Instagram</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a
                href="https://instagram.com/mirianserrano"
                target="_blank"
                rel="noopener noreferrer"
              >
                Seguir
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-12 font-serif text-2xl text-primary">Dúvidas frequentes</h2>
      <Accordion type="single" collapsible className="mt-4">
        {faq.map((item, index) => (
          <AccordionItem key={item.question} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
