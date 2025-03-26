import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";
import { WorkflowManagementForm } from "@/components/workflow-management-form";
import type { ApprovalWorkflow } from "@shared/schema";

export default function WorkflowManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);

  const { data: workflows, isLoading } = useQuery<ApprovalWorkflow[]>({
    queryKey: ['/api/approval-workflows'],
    queryFn: async () => {
      const response = await fetch('/api/approval-workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      return response.json();
    },
  });

  const handleEdit = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingWorkflow(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Approval Workflow Management</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Workflow
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Level 1 Approver</TableHead>
              <TableHead>Level 2 Approver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows?.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>{workflow.region}</TableCell>
                <TableCell>{workflow.department}</TableCell>
                <TableCell>{workflow.unit}</TableCell>
                <TableCell>{workflow.level1Approver?.employee_name}</TableCell>
                <TableCell>{workflow.level2Approver?.employee_name}</TableCell>
                <TableCell>
                  <Badge variant={workflow.is_active ? "default" : "secondary"}>
                    {workflow.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(workflow)}
                    className="flex items-center gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Edit Workflow" : "Add Workflow"}
            </DialogTitle>
          </DialogHeader>
          <WorkflowManagementForm
            initialData={editingWorkflow}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
