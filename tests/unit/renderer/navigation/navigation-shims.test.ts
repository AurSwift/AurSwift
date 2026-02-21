import { describe, expect, it } from "vitest";
import { NavigationProvider as LegacyNavigationProvider } from "@/navigation";
import { NavigationProvider as CanonicalNavigationProvider } from "@/features/navigation";
import { useNavigation as legacyUseNavigation } from "@/navigation/hooks/use-navigation";
import { useNavigation as canonicalUseNavigation } from "@/features/navigation/hooks/use-navigation";
import { useNestedNavigation as legacyUseNestedNavigation } from "@/navigation/hooks/use-nested-navigation";
import { useNestedNavigation as canonicalUseNestedNavigation } from "@/features/navigation/hooks/use-nested-navigation";
import { mapActionToView as legacyMapActionToView } from "@/navigation/utils/navigation-mapper";
import { mapActionToView as canonicalMapActionToView } from "@/features/navigation/utils/navigation-mapper";
import { getView as legacyGetView } from "@/navigation/registry/view-registry";
import { getView as canonicalGetView } from "@/features/navigation/registry/view-registry";
import { ProtectedAppShell as legacyProtectedAppShell } from "@/navigation/components/protected-app-shell";
import { ProtectedAppShell as canonicalProtectedAppShell } from "@/features/navigation/components/protected-app-shell";
import { AuthenticatedAppShell as legacyAuthenticatedAppShell } from "@/navigation/components/authenticated-app-shell";
import { AuthenticatedAppShell as canonicalAuthenticatedAppShell } from "@/features/navigation/components/authenticated-app-shell";

describe("navigation compatibility shims", () => {
  it("re-exports canonical APIs from legacy paths", () => {
    expect(LegacyNavigationProvider).toBe(CanonicalNavigationProvider);
    expect(legacyUseNavigation).toBe(canonicalUseNavigation);
    expect(legacyUseNestedNavigation).toBe(canonicalUseNestedNavigation);
    expect(legacyMapActionToView).toBe(canonicalMapActionToView);
    expect(legacyGetView).toBe(canonicalGetView);
    expect(legacyProtectedAppShell).toBe(canonicalProtectedAppShell);
    expect(legacyAuthenticatedAppShell).toBe(canonicalAuthenticatedAppShell);
  });
});
