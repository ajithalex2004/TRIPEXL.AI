import { useEmployeeDetails, useEmployeeSubordinates, useEmployeeBookings, useTeamBookings } from "@/hooks/use-employee-data";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export function EmployeeDashboard({ employeeId }: { employeeId: number }) {
  const { data: employee, isLoading: isLoadingEmployee } = useEmployeeDetails(employeeId);
  const { data: subordinates, isLoading: isLoadingSubordinates } = useEmployeeSubordinates(employeeId);
  const { data: bookings, isLoading: isLoadingBookings } = useEmployeeBookings(employeeId);
  const { data: teamBookings, isLoading: isLoadingTeamBookings } = useTeamBookings(employeeId);

  if (isLoadingEmployee || isLoadingSubordinates || isLoadingBookings || isLoadingTeamBookings) {
    return <LoadingIndicator />;
  }

  return (
    <div className="space-y-6">
      {/* Employee Details */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Employee Details</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Name:</strong> {employee?.name}</p>
            <p><strong>Designation:</strong> {employee?.designation}</p>
            {employee?.supervisor && (
              <p><strong>Supervisor:</strong> {employee.supervisor.name} ({employee.supervisor.designation})</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subordinates */}
      {subordinates?.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Team Members</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {subordinates.map(subordinate => (
                <li key={subordinate.id}>
                  {subordinate.employeeName} - {subordinate.designation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Employee's Bookings */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">My Bookings</h2>
        </CardHeader>
        <CardContent>
          {bookings?.length ? (
            <ul className="space-y-2">
              {bookings.map(booking => (
                <li key={booking.id} className="p-2 bg-secondary rounded">
                  <p><strong>Reference:</strong> {booking.referenceNo}</p>
                  <p><strong>Purpose:</strong> {booking.purpose}</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                  <p><strong>Time:</strong> {booking.pickupTime} - {booking.dropoffTime}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No bookings found</p>
          )}
        </CardContent>
      </Card>

      {/* Team Bookings (for supervisors) */}
      {teamBookings?.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Team Bookings</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {teamBookings.map(booking => (
                <li key={booking.id} className="p-2 bg-secondary rounded">
                  <p><strong>Employee:</strong> {booking.employee.name}</p>
                  <p><strong>Reference:</strong> {booking.referenceNo}</p>
                  <p><strong>Purpose:</strong> {booking.purpose}</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
