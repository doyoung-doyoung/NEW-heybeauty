import AppShell from "@/components/AppShell";
import { DbProvider } from "@/lib/db";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth";

export default function Page() {
  return (
    <DbProvider>
      <ToastProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ToastProvider>
    </DbProvider>
  );
}
