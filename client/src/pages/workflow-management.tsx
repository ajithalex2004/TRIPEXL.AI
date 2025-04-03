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
import { PageTransition } from "@/components/page-transition";

export default function WorkflowManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);

  const { data: workflows, isLoading, error } = useQuery<ApprovalWorkflow[]>({
    queryKey: ['/api/approval-workflows'],
    queryFn: async () => {
      console.log("Fetching workflows from /api/approval-workflows");
      const response = await fetch('/api/approval-workflows');
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status}`);
      }
      const data = await response.json();
      console.log("Received workflows data:", data);
      return data;
    }
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
    <PageTransition>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004990] to-[#0066cc]">
            Approval Workflow Management
          </h1>
          <Button onClick={handleAdd} className="flex items-center gap-2 bg-gradient-to-r from-[#004990] to-[#0066cc]">
            <Plus className="h-4 w-4" />
            Add Workflow
          </Button>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Levels Required</TableHead>
                <TableHead>Level 1 Approver</TableHead>
                <TableHead>Level 2 Approver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows?.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>{workflow.workflow_name}</TableCell>
                  <TableCell>{workflow.region}</TableCell>
                  <TableCell>{workflow.department}</TableCell>
                  <TableCell>{workflow.unit}</TableCell>
                  <TableCell>{workflow.levels_required}</TableCell>
                  <TableCell>{workflow.level1Approver?.employee_name}</TableCell>
                  <TableCell>{workflow.level2Approver?.employee_name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={workflow.is_active ? "default" : "secondary"}
                      className={workflow.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
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
    </PageTransition>
  );
}