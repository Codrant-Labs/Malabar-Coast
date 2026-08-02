import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, isAdminConfigured } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  credentials: "The sign-in details were not accepted.",
  "rate-limit": "Too many sign-in attempts. Wait 15 minutes before trying again.",
  configuration: "Administrator access is not configured for this deployment.",
  request: "The sign-in request could not be verified.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <main className="adminShell adminLoginShell">
      <section className="adminLoginCard" aria-labelledby="admin-login-title">
        <p>Malabar Coast · Private operations</p>
        <h1 id="admin-login-title">Restaurant<br />control room.</h1>
        <span>Administrator sessions are signed, HTTP-only and limited to eight hours.</span>
        {error && errorMessages[error] && <div className="adminAlert isError" role="alert">{errorMessages[error]}</div>}
        {configured ? (
          <form action="/api/admin/login" method="post">
            <label>Administrator username<input name="username" type="text" autoComplete="username" maxLength={160} required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" minLength={12} maxLength={256} required /></label>
            <button type="submit">Enter secure operations <span aria-hidden="true">→</span></button>
          </form>
        ) : (
          <div className="adminSetupNotice">
            <strong>Setup required</strong>
            <p>Add the administrator username, scrypt password hash and a 32-character session secret to the deployment environment before this page can accept a login.</p>
          </div>
        )}
        <Link href="/">Return to the restaurant <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
