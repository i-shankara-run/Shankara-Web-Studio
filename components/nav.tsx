"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const target = document.querySelector(".hero-wordmark") as HTMLElement | null;
    if (!target) {
      setScrolled(true);
      return;
    }
    const update = () => {
      const rect = target.getBoundingClientRect();
      setScrolled(rect.bottom <= 84);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const onLoad = () => update();
    window.addEventListener("load", onLoad);
    const t = window.setTimeout(update, 600);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("load", onLoad);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <nav className={`nav-shell ${scrolled ? "scrolled" : ""}`}>
      <Link href="/#top" className="nav-brand-link" aria-label="Shankara · run">
        <Image
          src="/logo-on-white.png"
          alt="Shankara"
          width={68}
          height={68}
          className="nav-brand-eye"
          unoptimized
        />
        <Image
          src="/wordmark.png"
          alt="Shankara · run"
          width={2805}
          height={1011}
          className="nav-brand-wordmark"
          unoptimized
        />
      </Link>
      <ul className="nav-links">
        <li><Link href="/#process" className="nav-link hidden-mobile">Process</Link></li>
        <li><Link href="/#packages" className="nav-link hidden-mobile">Packages</Link></li>
      </ul>
    </nav>
  );
}
