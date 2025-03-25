import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { EmployeeMasterTable } from "@/components/employee-master-table";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function EmployeeManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Add New Employee</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <AddEmployeeForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <EmployeeMasterTable />
      </Card>
    </div>
  );
}