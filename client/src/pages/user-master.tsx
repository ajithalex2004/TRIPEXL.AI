import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserFormDialog, UserFormData } from "@/components/user-form-dialog";
import { QuickActionsFAB } from "@/components/quick-actions-fab";
import { queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  user_name: string;
  user_code: string;
  user_type: string;
  email_id: string;
  country_code: string;
  mobile_number: string;
  user_operation_type: string;
  user_group: string;
  full_name: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const USERS_QUERY_KEY = "/api/auth/users";

export default function UserMasterPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: [USERS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch(USERS_QUERY_KEY);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      console.log("Creating user with data:", {
        ...userData,
        password: '[REDACTED]'
      });

      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (data: UserFormData) => {
    try {
      console.log('Submitting user data:', {
        ...data,
        password: '[REDACTED]'
      });
      await createUserMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
      throw error;
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => {
      console.log("Updating user:", id, "with data:", {
        ...data,
        password: '[REDACTED]'
      });

      const response = await fetch(`${USERS_QUERY_KEY}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ...data,
          country_code: data.country_code || "+971",
          mobile_number: data.mobile_number,
          updated_at: new Date()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      setIsFormOpen(false); // Close the dialog after successful update
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data
      });
    } catch (error) {
      console.error("Error in handleUpdateUser:", error);
      throw error;
    }
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Deleting user:", id);
      const response = await fetch(`${USERS_QUERY_KEY}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
    } catch (error) {
      console.error("Error in handleDeleteUser:", error);
    }
  };

  const openCreateDialog = () => {
    setFormMode("create");
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (user: User) => {
    setFormMode("edit");
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleExportUsers = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon!",
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    toast({
      title: "Success",
      description: "User list refreshed",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading users. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Master</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">User List</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Code</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Operation Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.user_code}</TableCell>
                  <TableCell>{user.user_name}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email_id}</TableCell>
                  <TableCell>
                    {user.country_code && user.mobile_number ? (
                      <span>{user.country_code} {user.mobile_number}</span>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.user_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.user_operation_type === "ADMIN"
                          ? "bg-blue-100 text-blue-800"
                          : user.user_operation_type === "MANAGEMENT"
                          ? "bg-purple-100 text-purple-800"
                          : user.user_operation_type === "SUPERVISOR"
                          ? "bg-green-100 text-green-800"
                          : user.user_operation_type === "EMPLOYEE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {user.user_operation_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.user_group}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={formMode === "create" ? handleCreateUser : handleUpdateUser}
        mode={formMode}
        initialData={selectedUser || undefined}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickActionsFAB
        onAddUser={openCreateDialog}
        onRefresh={handleRefresh}
        onExport={handleExportUsers}
      />
    </div>
  );
}