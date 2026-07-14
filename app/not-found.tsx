import Link from "next/link";

export default function NotFound() {
  return (
    <main className="notFoundPage">
      <p>404 · Off the chart</p>
      <h1><span>This route</span><span>missed the coast.</span></h1>
      <div>
        <Link href="/">Return home <span aria-hidden="true">→</span></Link>
        <Link href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}

