/**
 * Scanner Status UI Components
 * Visual feedback for barcode scanner status and activity
 */

import React from "react";
import { AnimatePresence } from "@/components/animate-presence";
import {
  ScanBarcode,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  Volume2,
  VolumeX,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ScannerStatus, ScanLog } from "@/services/hardware/scanner";

interface ScannerStatusBarProps {
  scannerStatus: ScannerStatus;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onReset?: () => void;
  className?: string;
}

/**
 * Main scanner status bar component
 */
export const ScannerStatusBar: React.FC<ScannerStatusBarProps> = ({
  scannerStatus,
  audioEnabled,
  onToggleAudio,
  onReset,
  className = "",
}) => {
  const getStatusIcon = () => {
    switch (scannerStatus.status) {
      case "ready":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "error":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "disabled":
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      default:
        return <ScanBarcode className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (scannerStatus.status) {
      case "ready":
        return "Scanner Ready";
      case "processing":
        return "Processing Scan...";
      case "error":
        return "Scan Error";
      case "disabled":
        return "Scanner Disabled";
      default:
        return "Scanner Status Unknown";
    }
  };

  const getStatusColor = () => {
    switch (scannerStatus.status) {
      case "ready":
        return "bg-green-50 border-green-200 text-green-800";
      case "processing":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "disabled":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()} ${className} animate-slide-down`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{getStatusText()}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Scans: {scannerStatus.scanCount}
          </Badge>

          {scannerStatus.lastScan && (
            <Badge variant="outline" className="text-xs font-mono">
              Last: {scannerStatus.lastScan.slice(-6)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAudio}
          className="h-8 w-8 p-0"
          title={
            audioEnabled ? "Disable scanner sounds" : "Enable scanner sounds"
          }
        >
          {audioEnabled ? (
            <Volume2 className="h-4 w-4 text-green-600" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs"
            title="Reset scanner"
          >
            Reset
          </Button>
        )}

        <div className="text-xs text-gray-500">
          {scannerStatus.isReady ? "Ready to scan" : "Busy"}
        </div>
      </div>
    </div>
  );
};

interface ScanHistoryProps {
  scanLog: ScanLog[];
  onClearLog?: () => void;
  maxVisible?: number;
  className?: string;
}

/**
 * Scan history component showing recent scans
 */
export const ScanHistory: React.FC<ScanHistoryProps> = ({
  scanLog,
  onClearLog,
  maxVisible = 5,
  className = "",
}) => {
  const recentScans = scanLog.slice(-maxVisible).reverse();

  if (recentScans.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-white border-slate-200 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-700 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Recent Scans
          </h4>
          {onClearLog && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLog}
              className="h-6 px-2 text-xs text-slate-500"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <AnimatePresence>
            {recentScans.map((scan, index) => (
              <div
                key={`${scan.timestamp}-${scan.barcode}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={`flex items-center justify-between text-xs p-2 rounded border animate-slide-left ${
                  scan.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {scan.success ? (
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                  )}

                  <span className="font-mono text-slate-800 truncate">
                    {scan.barcode}
                  </span>

                  {scan.productName && (
                    <span className="text-slate-600 truncate">
                      {scan.productName}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-slate-500 text-xs">
                    {scan.timestamp}
                  </span>

                  {!scan.success && scan.error && (
                    <span
                      className="text-red-600 text-xs truncate max-w-20"
                      title={scan.error}
                    >
                      {scan.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>

        {scanLog.length > maxVisible && (
          <div className="text-center mt-2">
            <span className="text-xs text-slate-500">
              Showing {maxVisible} of {scanLog.length} scans
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ScannerGuideProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

/**
 * Scanner setup guide component
 */
export const ScannerGuide: React.FC<ScannerGuideProps> = ({
  isVisible,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="max-w-md w-full bg-white animate-modal-enter-95">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <ScanBarcode className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-slate-800">
              Barcode Scanner Setup
            </h3>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Connect your USB barcode scanner</span>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Ensure scanner is set to "USB Keyboard" mode</span>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Click on this window to ensure focus</span>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Start scanning products directly</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Compatible scanners:</strong> Zebra, Honeywell, Datalogic,
              Socket Mobile, and any scanner with USB HID keyboard emulation.
            </p>
          </div>

          {onDismiss && (
            <Button className="w-full mt-4" onClick={onDismiss}>
              Got it, start scanning!
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
