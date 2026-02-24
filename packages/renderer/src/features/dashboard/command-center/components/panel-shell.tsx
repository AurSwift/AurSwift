import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { COMMAND_CENTER_THEME } from "../constants/command-center-theme";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelShell({
  title,
  subtitle,
  rightSlot,
  children,
  className,
}: PanelShellProps) {
  return (
    <section className={cn(COMMAND_CENTER_THEME.panel, className)}>
      <header
        className={cn(
          "flex items-start justify-between gap-2 sm:gap-3",
          COMMAND_CENTER_THEME.panelHeader,
        )}
      >
        <div className="min-w-0">
          <h3 className="text-panel-title text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-panel-subtitle">{subtitle}</p>
          ) : null}
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </header>

      <div className={COMMAND_CENTER_THEME.panelBody}>{children}</div>
    </section>
  );
}
