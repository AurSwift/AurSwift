/**
 * License Activation Screen
 *
 * Full-screen component for license key entry and activation.
 * Shown on first launch or when no valid license is found.
 */

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLicense, type MachineInfo } from "../hooks/use-license";
import {
  KeyRound,
  Monitor,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Power,
} from "lucide-react";
import { AdaptiveKeyboard } from "@/features/adaptive-keyboard/adaptive-keyboard";
import { getLogger } from "@/shared/utils/logger";
import { getAppVersion } from "@/shared/utils/version";

const logger = getLogger("license-activation");

interface LicenseActivationScreenProps {
  onActivationSuccess: () => void;
}

export function LicenseActivationScreen({
  onActivationSuccess,
}: LicenseActivationScreenProps) {
  const { activate, getMachineInfo, isLoading, error, clearError } =
    useLicense();

  const [licenseKey, setLicenseKey] = useState("");
  const [terminalName, setTerminalName] = useState("");
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Load machine info on mount
  useEffect(() => {
    getMachineInfo().then(setMachineInfo);
  }, [getMachineInfo]);

  // Format license key as user types (auto-uppercase, add dashes)
  const handleLicenseKeyChange = (value: string) => {
    // Remove any existing formatting
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Add formatting: AUR-{PLAN}-V2-{8CHARS}-{8CHARS}
    let formatted = "";
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, 3); // AUR
    }
    if (cleaned.length > 3) {
      formatted += "-" + cleaned.substring(3, 6); // -BAS/PRO/ENT
    }
    if (cleaned.length > 6) {
      formatted += "-" + cleaned.substring(6, 8); // -V2
    }
    if (cleaned.length > 8) {
      formatted += "-" + cleaned.substring(8, 16); // -XXXXXXXX (8 chars)
    }
    if (cleaned.length > 16) {
      formatted += "-" + cleaned.substring(16, 24); // -XXXXXXXX (8 chars)
    }

    setLicenseKey(formatted);
    setActivationError(null);
    clearError();
  };

  // Adaptive keyboard handlers
  const handleKeyboardInput = (value: string) => {
    handleLicenseKeyChange(licenseKey + value);
  };

  const handleKeyboardBackspace = () => {
    handleLicenseKeyChange(licenseKey.slice(0, -1));
  };

  const handleKeyboardClear = () => {
    setLicenseKey("");
    setActivationError(null);
    clearError();
  };

  const handleKeyboardEnter = () => {
    setKeyboardVisible(false);
    if (licenseKey && licenseKey.length >= 28) {
      handleActivate();
    }
  };

  // Handle activation
  const handleActivate = async () => {
    if (!licenseKey || licenseKey.length < 28) {
      setActivationError("Please enter a valid license key");
      return;
    }

    setActivationError(null);

    const result = await activate(licenseKey, terminalName || undefined);

    if (result.success) {
      setIsSuccess(true);
      // Short delay to show success state
      setTimeout(() => {
        onActivationSuccess();
      }, 1500);
    } else {
      setActivationError(
        result.message || "Activation failed. Please check your license key."
      );
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleActivate();
    }
  };

  const handleCloseApp = async () => {
    try {
      await window.appAPI.quit();
    } catch (error) {
      logger.error("Failed to close app:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Power Button Header */}
      <div className="w-full flex justify-end p-4 sm:p-6">
        <Button
          onClick={handleCloseApp}
          variant="ghost"
          size="lg"
          className="hover:bg-destructive/10 hover:text-destructive h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          title="Close Application"
        >
          <Power className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">aurswift EPOS</h1>
            <p className="text-sm text-muted-foreground">
              Version {getAppVersion()}
            </p>
            <p className="text-muted-foreground">
              Enter your license key to activate this terminal
            </p>
          </div>

          {/* Activation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                License Activation
              </CardTitle>
              <CardDescription>
                Find your license key in your aurswift dashboard at{" "}
                <span className="font-medium text-primary">aurswift.com</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success State */}
              {isSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    License activated successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Error State */}
              {(activationError || error) && !isSuccess && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {activationError || error}
                  </AlertDescription>
                </Alert>
              )}

              {/* License Key Input */}
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  ref={licenseInputRef}
                  id="license-key"
                  type="text"
                  placeholder="AUR-XXX-V2-XXXXXXXX-XX"
                  value={licenseKey}
                  onChange={(e) => handleLicenseKeyChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setKeyboardVisible(true)}
                  className="font-mono text-lg tracking-wider"
                  disabled={isLoading || isSuccess}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Format: AUR-PRO-V2-XXXXXXXX-XX
                </p>
              </div>

              {/* Terminal Name Input */}
              <div className="space-y-2">
                <Label htmlFor="terminal-name">
                  Terminal Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="terminal-name"
                    type="text"
                    placeholder={machineInfo?.hostname || "Main Counter"}
                    value={terminalName}
                    onChange={(e) => setTerminalName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              {/* Activate Button */}
              <Button
                onClick={handleActivate}
                disabled={isLoading || isSuccess || licenseKey.length < 20}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Activated!
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Activate License
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Adaptive Keyboard */}
          {keyboardVisible && !isSuccess && (
            <div className="rounded-lg overflow-hidden shadow-lg">
              <AdaptiveKeyboard
                onInput={handleKeyboardInput}
                onBackspace={handleKeyboardBackspace}
                onClear={handleKeyboardClear}
                onEnter={handleKeyboardEnter}
                initialMode="qwerty"
                inputType="text"
                visible={keyboardVisible}
                onClose={() => setKeyboardVisible(false)}
              />
            </div>
          )}

          {/* Help Link */}
          <p className="text-center text-sm text-muted-foreground">
            Need help?{" "}
            <a
              href="https://aurswift.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
