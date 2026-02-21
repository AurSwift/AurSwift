import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { FeatureMenuBar } from "@/features/dashboard/components/feature-menu-bar";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";

const mockUseFeatureVisibility = vi.fn();
const mockUseUserPermissions = vi.fn();

vi.mock("@/features/dashboard/hooks/use-feature-visibility", () => ({
  useFeatureVisibility: (...args: unknown[]) => mockUseFeatureVisibility(...args),
}));

vi.mock("@/features/dashboard/hooks/use-user-permissions", () => ({
  useUserPermissions: () => mockUseUserPermissions(),
}));

describe("FeatureMenuBar", () => {
  it("renders centralized system settings extras in top menu", async () => {
    mockUseFeatureVisibility.mockReturnValue({
      isVisible: true,
      canAccess: true,
      requiresUpgrade: false,
      upgradeInfo: undefined,
    });

    mockUseUserPermissions.mockReturnValue({
      hasAnyPermission: () => true,
      isLoading: false,
    });

    const onActionClick = vi.fn();

    const features: FeatureConfig[] = [
      {
        id: "system-settings",
        title: "System Settings",
        description: "Configure system preferences",
        icon: Settings,
        permissions: [],
        category: "settings",
        actions: [
          {
            id: "general-settings",
            label: "General Settings",
            icon: Settings,
            onClick: () => {},
          },
        ],
      },
    ];

    render(<FeatureMenuBar features={features} onActionClick={onActionClick} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));

    expect(screen.getByText("Show license info")).toBeInTheDocument();
    expect(screen.getByText("Change PIN")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
    expect(screen.getByText("Quit App")).toBeInTheDocument();
  });
});
