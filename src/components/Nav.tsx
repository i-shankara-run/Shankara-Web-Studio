import { useEffect, useState } from "react";
import logoOnBlue from "@/assets/logo-on-blue.png";
import logoOnWhite from "@/assets/logo-on-white.png";
import wordmark from "@/assets/wordmark.png";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav-shell ${scrolled ? "scrolled" : ""}`}>
      <a href="#top" className="nav-brand-link">
        {/* Eye logo — color-matched to nav background so the square blends in and only the eye reads. */}
        <img src={logoOnBlue} alt="Shankara" className="nav-brand-eye nav-brand-eye--top" />
        <img
          src={logoOnWhite}
          alt=""
          aria-hidden="true"
          className="nav-brand-eye nav-brand-eye--scrolled"
        />
        <img src={wordmark} alt="Shankara · run" className="nav-brand-wordmark" />
      </a>
      <ul className="flex items-center gap-9 list-none m-0 p-0">
        <li className="hidden md:block">
          <a href="#process" className="nav-link">
            Process
          </a>
        </li>
        <li className="hidden md:block">
          <a href="#packages" className="nav-link">
            Packages
          </a>
        </li>
        <li>
          <a href="#contact" className="nav-link nav-pill">
            Ask Shankara
          </a>
        </li>
      </ul>
    </nav>
  );
}
