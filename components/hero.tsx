"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface HeroProps {
  onOpenChat: () => void;
}

export function Hero({ onOpenChat }: HeroProps) {
  const [isApple, setIsApple] = useState(false);
  useEffect(() => {
    setIsApple(/iPad|iPhone|iPod|Macintosh|Mac OS/.test(navigator.userAgent));
  }, []);

  return (
    <header id="top" className="hero-wrap">
      <div className="hero-inner">
        <div className="hero-media">
          {isApple ? (
            <video src="/Withemoticon_safari.mov" autoPlay loop muted playsInline />
          ) : (
            <video src="/Withemoticon.webm" autoPlay loop muted playsInline />
          )}
        </div>
        <div className="hero-content">
          <Image
            src="/wordmark.png"
            alt="Shankara · run"
            width={2805}
            height={1011}
            priority
            unoptimized
            className="hero-wordmark"
          />
          <h1>
            Your business
            <em>deserves to be online.</em>
          </h1>
          <p className="hero-tagline">
            Honest pricing. AI-accelerated delivery. Code that never breaks character.
          </p>
          <p className="hero-body">
            Shankara builds websites and digital tools that work as hard as you do —
            from your first webpage to a full AI-powered enterprise.
          </p>
          <div className="hero-actions">
            <a href="#packages" className="btn-fill">See packages →</a>
            <button type="button" className="btn-outline" onClick={onOpenChat}>
              Get a free demo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
