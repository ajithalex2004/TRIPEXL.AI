import { Card } from "@/components/ui/card";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { EmployeeList } from "@/components/employee-list";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QuickActionsFAB } from "@/components/quick-actions-fab";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function EmployeeManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleAddUser = () => {
    setIsAddDialogOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    toast({
      title: "Refreshed",
      description: "Employee list has been refreshed",
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon",
    });
  };

  return (
    <div className="container mx-auto p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <Card className="overflow-hidden p-6">
        <EmployeeList />
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto px-6">
            <AddEmployeeForm onSuccess={() => setIsAddDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions FAB */}
      <QuickActionsFAB
        onAddUser={handleAddUser}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  );
}