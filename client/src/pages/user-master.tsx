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
import { UserFormDialog } from "@/components/user-form-dialog";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: number;
  user_name: string;
  user_code: string;
  user_type: string;
  email_id: string;
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
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log("Creating user with data:", { ...userData, password: '[REDACTED]' });
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ...userData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log("Updating user:", id, "with data:", data);
      const response = await fetch(`${USERS_QUERY_KEY}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleCreateUser = async (data: any) => {
    try {
      console.log('Submitting user data:', { ...data, password: '[REDACTED]' });
      await createUserMutation.mutateAsync({
        ...data,
        is_active: true,
        password: data.password || "Pass@123"
      });
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
    }
  };

  const handleUpdateUser = async (data: any) => {
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: {
          ...data,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error in handleUpdateUser:", error);
    }
  };

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
        <Button
          className="bg-[#004990] hover:bg-[#003870]"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">User List</h2>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.user_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.user_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.user_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.user_operation_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.user_group}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={formMode === "create" ? handleCreateUser : handleUpdateUser}
        defaultValues={selectedUser || undefined}
        mode={formMode}
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
    </div>
  );
}