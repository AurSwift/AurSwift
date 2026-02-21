import { OperationsOverview } from "@/features/dashboard/components/operations-overview";

interface RoleDashboardViewProps {
  role: "admin" | "manager";
}

const RoleDashboardView = ({ role }: RoleDashboardViewProps) => {
  const containerClass =
    role === "admin"
      ? "container mx-auto max-w-[1600px]"
      : "mx-auto w-full max-w-[1400px]";

  return (
    <div className={`${containerClass} p-3 sm:p-4`}>
      <OperationsOverview />
    </div>
  );
};

export default RoleDashboardView;
