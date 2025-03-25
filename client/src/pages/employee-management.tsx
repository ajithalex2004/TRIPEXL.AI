import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { EmployeeList } from "@/components/employee-list";
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto px-6">
              <AddEmployeeForm onSuccess={() => setIsAddDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden p-6">
        <EmployeeList />
      </Card>
    </div>
  );
}