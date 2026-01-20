import { AuthProvider } from "@/features/auth";
import { LicenseProvider } from "@/features/license";
import { AppFlowProvider } from "@/app/context/app-flow-context";

interface AppProvidersProps {
  children: React.ReactNode;
}

import { UpdateToastProvider } from "@/features/updates/context/UpdateToastContext";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppFlowProvider>
      <LicenseProvider>
        <AuthProvider>
          <UpdateToastProvider>{children}</UpdateToastProvider>
        </AuthProvider>
      </LicenseProvider>
    </AppFlowProvider>
  );
}
