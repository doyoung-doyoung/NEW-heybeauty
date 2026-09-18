import AppShell from "@/components/AppShell";
import { DbProvider } from "@/lib/db";
import { ToastProvider } from "@/components/ui/Toast";

export default function Page() {
  return (
    <DbProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </DbProvider>
  );
}
