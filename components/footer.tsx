import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <Link href="/#top" className="footer-brand" aria-label="Shankara · run">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/footer.png" alt="Shankara · run" className="footer-brand-img" />
      </Link>
      <div className="footer-content">
        <p className="footer-tagline">Websites that work as hard as you do.</p>
        <div className="footer-links">
          <Link href="/#top" className="footer-link">Home</Link>
          <Link href="/#process" className="footer-link">Process</Link>
          <Link href="/#packages" className="footer-link">Packages</Link>
          <Link href="/#contact" className="footer-link">Contact</Link>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Shankara · run. All rights reserved.</p>
      </div>
    </footer>
  );
}
