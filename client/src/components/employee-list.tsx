import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddEmployeeForm } from "./add-employee-form";
import { LoadingAnimation } from "./loading-animation";
import { Department, EmployeeType, Region } from "@shared/schema";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "./status-badge";

interface Employee {
  id: number;
  employee_id: string;
  employee_name: string;
  email_id: string;
  mobile_number: string;
  employee_type: string;
  designation: string;
  department: string;
  nationality: string;
  region: string;
  communication_language: string | null;
  unit: string;
  date_of_birth?: string;
  hierarchy_level?: string;
  supervisor_id?: number | null;
  is_active?: boolean;
}

export function EmployeeList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);

  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch employees');
        }
        return response.json();
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        throw error;
      }
    },
    retry: 1
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      console.log("Deleting employee with ID:", employeeId);
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Delete error response:', error);
        throw new Error('Failed to delete employee');
      }

      try {
        return await response.json();
      } catch (e) {
        // If the response is not JSON, return a default success response
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    console.log("Handling delete for employee ID:", id);
    setEmployeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      console.log("Confirming delete for employee ID:", employeeToDelete);
      deleteEmployeeMutation.mutate(employeeToDelete);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingAnimation size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Error loading employees</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = searchTerm === "" || 
      employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toString().includes(searchTerm);

    const matchesDepartment = departmentFilter === "all" || 
      employee.department === departmentFilter;

    const matchesRegion = regionFilter === "all" || 
      employee.region === regionFilter;

    const matchesType = typeFilter === "all" || 
      employee.employee_type === typeFilter;

    return matchesSearch && matchesDepartment && matchesRegion && matchesType;
  });


  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {Object.values(Department).map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {Object.values(Region).map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(EmployeeType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employees || filteredEmployees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  {!employees ? "No employees found" : "No employees found matching the filters"}
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell>{employee.email_id}</TableCell>
                  <TableCell>{employee.mobile_number}</TableCell>
                  <TableCell>{employee.employee_type}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.region}</TableCell>
                  <TableCell>{employee.unit}</TableCell>
                  <TableCell>
                    <StatusBadge status={employee.is_active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                        className="flex items-center gap-1 hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto px-6">
            {editingEmployee && (
              <AddEmployeeForm
                initialData={editingEmployee}
                onSuccess={() => setIsEditDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}