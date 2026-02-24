import { OperationsOverview } from "@/features/dashboard/components/operations-overview";

interface RoleDashboardViewProps {
  role: "admin" | "manager";
}

const RoleDashboardView = ({ role: _role }: RoleDashboardViewProps) => {
  return (
    <div className="min-h-full">
      <OperationsOverview />
    </div>
  );
};

export default RoleDashboardView;
