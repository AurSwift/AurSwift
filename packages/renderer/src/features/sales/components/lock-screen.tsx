/**
 * Till Lock Screen Component
 *
 * Full-screen overlay shown when till is locked
 * - Shows break status and timer
 * - PIN entry to unlock
 * - Automatically ends break on unlock
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Coffee, Clock, User } from "lucide-react";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("lock-screen");

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  /** User ID of the user who locked the till (used to verify PIN). */
  lockedByUserId: string;
  activeBreak?: {
    id: string;
    type: "meal" | "rest" | "other";
    start_time: string;
    is_paid: boolean;
  } | null;
  userName: string;
}

export function LockScreen({
  isLocked,
  onUnlock,
  lockedByUserId,
  activeBreak,
  userName,
}: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [breakDuration, setBreakDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate break duration
  useEffect(() => {
    if (activeBreak?.start_time) {
      const interval = setInterval(() => {
        const breakStart = new Date(activeBreak.start_time).getTime();
        const now = Date.now();
        const seconds = Math.floor((now - breakStart) / 1000);
        setBreakDuration(seconds);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeBreak]);

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setIsUnlocking(true);
    setError("");

    try {
      // Verify PIN for the user who locked the till
      const response = await window.authAPI.verifyPin(lockedByUserId, pin);

      if (response.success) {
        // If there's an active break, end it
        if (activeBreak) {
          const breakEndResponse = await window.timeTrackingAPI.endBreak(
            activeBreak.id
          );
          if (breakEndResponse.success) {
            logger.info("Break ended on unlock:", breakEndResponse.break);
          } else {
            logger.warn(
              "Failed to end break on unlock:",
              breakEndResponse.message
            );
          }
        }

        onUnlock();
        setPin("");
      } else {
        setError("Invalid PIN");
        setPin("");
      }
    } catch (err) {
      logger.error("Failed to unlock:", err);
      setError("An error occurred");
      setPin("");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");
    setPin(digitsOnly);
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getBreakTypeLabel = (type: string): string => {
    switch (type) {
      case "meal":
        return "Meal Break";
      case "rest":
        return "Rest Break";
      default:
        return "Break";
    }
  };

  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        {/* Lock Icon and Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
            <Lock className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Till Locked</h1>
          <p className="text-slate-400">Enter your PIN to unlock</p>
        </div>

        {/* Current Time */}
        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold text-white mb-1">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-slate-400">
            {currentTime.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Break Status */}
        {activeBreak && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-200">
                  {getBreakTypeLabel(activeBreak.type)}
                </span>
              </div>
              <span className="text-xs text-amber-400">
                {activeBreak.is_paid ? "Paid" : "Unpaid"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-mono font-bold text-amber-300">
                {formatDuration(breakDuration)}
              </span>
            </div>
            <p className="text-xs text-amber-400 mt-2">
              Break will end automatically when you unlock
            </p>
          </div>
        )}

        {/* User Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Locked by</div>
              <div className="text-base font-medium text-white">{userName}</div>
            </div>
          </div>
        </div>

        {/* PIN Entry */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Enter PIN
          </label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="••••"
            className="text-center text-2xl tracking-widest mb-4 bg-slate-900 border-slate-600 text-white"
            autoFocus
            maxLength={6}
          />

          {error && (
            <div className="text-sm text-red-400 mb-4 text-center">{error}</div>
          )}

          <Button
            onClick={handleUnlock}
            disabled={isUnlocking || pin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isUnlocking ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Unlocking...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Unlock Till
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Aurswift Epos System © {currentTime.getFullYear()}
        </p>
      </div>
    </div>
  );
}
