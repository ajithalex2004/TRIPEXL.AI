import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingAnimation } from "./loading-animation";

interface Employee {
  employeeId: string;
  employeeName: string;
  email: string;
  mobileNumber: string;
  employeeType: string;
  designation: string;
  department: string;
  nationality: string;
  region: string;
  communicationLanguage: string;
  unit: string;
}

export function EmployeeMasterTable() {
  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingAnimation size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load employee data
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">Employee Master Table</h2>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((employee) => (
              <TableRow key={employee.employeeId}>
                <TableCell className="font-medium">{employee.employeeId}</TableCell>
                <TableCell>{employee.employeeName}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.mobileNumber}</TableCell>
                <TableCell>{employee.employeeType}</TableCell>
                <TableCell>{employee.designation}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.region}</TableCell>
                <TableCell>{employee.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
