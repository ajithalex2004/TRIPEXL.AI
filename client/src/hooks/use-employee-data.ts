import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";

interface EmployeeDetails extends Employee {
  supervisor?: {
    id: number;
    name: string;
    designation: string;
  };
}

interface EmployeeBooking {
  id: number;
  referenceNo: string;
  purpose: string;
  status: string;
  pickupTime: string;
  dropoffTime: string;
  employee: {
    id: number;
    name: string;
  };
}

export function useEmployeeDetails(employeeId: number) {
  return useQuery<EmployeeDetails>({
    queryKey: ["/api/employees", employeeId, "details"],
    enabled: !!employeeId
  });
}

export function useEmployeeSubordinates(employeeId: number) {
  return useQuery<Employee[]>({
    queryKey: ["/api/employees", employeeId, "subordinates"],
    enabled: !!employeeId
  });
}

export function useEmployeeBookings(employeeId: number) {
  return useQuery<EmployeeBooking[]>({
    queryKey: ["/api/employees", employeeId, "bookings"],
    enabled: !!employeeId
  });
}

export function useTeamBookings(supervisorId: number) {
  return useQuery<EmployeeBooking[]>({
    queryKey: ["/api/employees", supervisorId, "team-bookings"],
    enabled: !!supervisorId
  });
}
