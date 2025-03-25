import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LoadingAnimation } from "./loading-animation";
import { Department, EmployeeType, Region } from "@shared/schema";
import { useState } from "react";

interface Employee {
  employee_id: string;
  employee_name: string;
  email_id: string;
  mobile_number: string;
  employee_type: string;
  designation: string;
  department: string;
  nationality: string;
  region: string;
  communication_language: string;
  unit: string;
}

export function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = searchTerm === "" || 
      employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toString().includes(searchTerm);

    const matchesDepartment = departmentFilter === "" || 
      employee.department === departmentFilter;

    const matchesRegion = regionFilter === "" || 
      employee.region === regionFilter;

    const matchesType = typeFilter === "" || 
      employee.employee_type === typeFilter;

    return matchesSearch && matchesDepartment && matchesRegion && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingAnimation size="lg" />
      </div>
    );
  }

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
              <SelectItem value="">All Departments</SelectItem>
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
              <SelectItem value="">All Regions</SelectItem>
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
              <SelectItem value="">All Types</SelectItem>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No employees found matching the filters
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees?.map((employee) => (
                <TableRow key={employee.employee_id}>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell>{employee.email_id}</TableCell>
                  <TableCell>{employee.mobile_number}</TableCell>
                  <TableCell>{employee.employee_type}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.region}</TableCell>
                  <TableCell>{employee.unit}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}