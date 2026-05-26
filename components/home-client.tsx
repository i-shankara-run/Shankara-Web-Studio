"use client";

import { useCallback, useState } from "react";
import { Hero } from "./hero";
import { ChooseStage } from "./choose-stage";
import { Packages } from "./packages";
import { Process } from "./process";
import { Contact } from "./contact";
import { Footer } from "./footer";
import { FloatChatButton } from "./float-chat-button";
import { AiChat, type AiChatContext } from "./ai-chat";
import type { OfferData } from "@/lib/packages";

export function HomeClient() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<AiChatContext>({});

  const openWithPackage = useCallback((pkg: OfferData) => {
    setChatContext({ selectedPackage: pkg });
    setChatOpen(true);
  }, []);

  const openBlank = useCallback(() => {
    setChatContext({});
    setChatOpen(true);
  }, []);

  return (
    <>
      <Hero onOpenChat={openBlank} />
      <ChooseStage />
      <Packages onStartDemo={openWithPackage} />
      <Process />
      <Contact onOpenChat={openBlank} />
      <Footer />
      {!chatOpen && <FloatChatButton onClick={openBlank} />}
      {chatOpen && <AiChat context={chatContext} onClose={() => setChatOpen(false)} />}
    </>
  );
}
