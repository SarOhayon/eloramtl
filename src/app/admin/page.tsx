import { connection } from "next/server";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/AdminApp";
import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/Wordmark";
import { adminPassword, isAdmin } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await connection(); // checked on every visit, never at build time
  if (!adminPassword()) {
    return (
      <Centered>
        <p className="text-sm text-brown-soft">The admin is off. Add an ADMIN_PASSWORD variable in Amplify and redeploy.</p>
      </Centered>
    );
  }
  if (!(await isAdmin())) {
    return (
      <Centered>
        <LoginForm />
      </Centered>
    );
  }
  return <AdminApp initial={await getContent()} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-sm border-t-2 border-gold bg-cream p-8 shadow-xl shadow-brown/5">
        <Wordmark className="mx-auto mb-8 h-12 w-auto" />
        {children}
      </div>
    </main>
  );
}
