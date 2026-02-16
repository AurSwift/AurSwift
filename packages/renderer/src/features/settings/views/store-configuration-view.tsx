import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLogger } from "@/shared/utils/logger";
import { useAuth } from "@/shared/hooks/use-auth";
import { TerminalForm } from "../components/terminal-form";
import { SettingsLayout } from "../components/settings-layout";
import { SETTINGS_ROUTES } from "../config/navigation";
import type { Terminal } from "@/types/api/terminals";

const logger = getLogger("store-configuration-view");

export default function StoreConfigurationView({
  onBack,
}: {
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [terminal, setTerminal] = useState<Terminal | null>(null);

  // Load terminal data on mount
  useEffect(() => {
    const loadTerminal = async () => {
      if (!user?.businessId) {
        setIsLoading(false);
        return;
      }

      // Get session token from authStore
      const token = await window.authStore.get("token");
      if (!token) {
        logger.warn("No session token found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        logger.info("Loading terminals for business:", user.businessId);
        const response = await window.terminalsAPI.getByBusiness(
          token,
          user.businessId
        );

        logger.info("Terminals API response:", response);

        if (
          response.success &&
          response.terminals &&
          response.terminals.length > 0
        ) {
          // Use the first terminal (you can extend this to support multiple terminals)
          const firstTerminal = response.terminals[0];
          logger.info("Loading terminal data:", firstTerminal);
          setTerminal(firstTerminal);
        } else {
          logger.warn("No terminals found for business");
          // You could create a default terminal here if needed
        }
      } catch (error) {
        logger.error("Error loading terminal:", error);
        toast.error("Failed to load terminal information");
      } finally {
        setIsLoading(false);
      }
    };

    loadTerminal();
  }, [user?.businessId]);

  if (isLoading) {
    return (
      <SettingsLayout
        activeTab={SETTINGS_ROUTES.STORE_CONFIGURATION}
        onBack={onBack}
      >
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </SettingsLayout>
    );
  }

  if (!terminal) {
    return (
      <SettingsLayout
        activeTab={SETTINGS_ROUTES.STORE_CONFIGURATION}
        onBack={onBack}
      >
        <div className="max-w-4xl">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <p className="text-muted-foreground">
              No terminal found. Please create a terminal first.
            </p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      activeTab={SETTINGS_ROUTES.STORE_CONFIGURATION}
      onBack={onBack}
    >
      <div className="max-w-4xl">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Terminal Information</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Update your terminal configuration and network settings.
          </p>
          <TerminalForm
            terminal={terminal}
            onUpdate={(updatedTerminal) => {
              setTerminal(updatedTerminal);
            }}
          />
        </div>
      </div>
    </SettingsLayout>
  );
}
