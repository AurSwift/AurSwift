import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { QuickActionItem } from "../types/command-center.types";

function isTextInput(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.isContentEditable
  );
}

export function useDashboardActionShortcuts(actions: QuickActionItem[]): void {
  const shortcutMap = useMemo(() => {
    const map = new Map<string, QuickActionItem>();
    for (const action of actions) {
      if (!action.shortcut) continue;
      map.set(action.shortcut.toUpperCase(), action);
    }
    return map;
  }, [actions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextInput(event.target)) {
        return;
      }

      const action = shortcutMap.get(event.key.toUpperCase());
      if (!action) {
        return;
      }

      event.preventDefault();

      if (action.disabled) {
        toast.warning(action.disabledReason || "Action is not available for your role.");
        return;
      }

      action.onTrigger();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcutMap]);
}
