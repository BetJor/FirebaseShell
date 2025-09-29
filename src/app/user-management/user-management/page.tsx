"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PlusCircle, Trash2, LogIn } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types";
import { getUsers, addUser, updateUser, deleteUser } from "@/lib/data";
import { useToast } from "@/components/shell/hooks/use-toast";
import { UserFormDialog } from "@/components/user-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"


export default function UserManagementPage() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin, impersonateUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Failed to load users:", error);
        toast({ variant: "destructive", title: "Error", description: "No se han podido cargar los usuarios." });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    try {
        await deleteUser(userId);
        toast({ title: "Usuario eliminado", description: "El usuario se ha eliminado correctamente." });
        await loadUsers();
    } catch (error) {
        console.error("Failed to delete user:", error);
        toast({ variant: "destructive", title: "Error", description: "No se ha podido eliminar el usuario." });
    }
  };

  const handleSave = async (data: Omit<User, "id">, id?: string) => {
    try {
        if (id) {
            await updateUser(id, data);
            toast({ title: "Usuario actualizado", description: "El usuario se ha actualizado correctamente." });
        } else {
            await addUser(data);
            toast({ title: "Usuario creado", description: "El usuario se ha creado correctamente." });
        }
        await loadUsers();
        setIsFormOpen(false);
    } catch (error) {
        console.error("Failed to save user:", error);
        toast({ variant: "destructive", title: "Error", description: "No se ha podido guardar el usuario." });
    }
  };
  
  const handleImpersonate = (userToImpersonate: User) => {
    impersonateUser(userToImpersonate);
    toast({
      title: "Suplantación iniciada",
      description: `Ahora estás actuando como ${userToImpersonate.name}.`,
    });
  };


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Gestiona los usuarios de la aplicación.</CardDescription>
        </div>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Nuevo Usuario
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : users.length > 0 ? (
                    users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right">
                             {isAdmin && currentUser?.id !== user.id && (
                                <Button variant="ghost" size="icon" onClick={() => handleImpersonate(user)} title={`Suplantar a ${user.name}`}>
                                    <LogIn className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id!)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No se han encontrado usuarios.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>

    {isFormOpen && (
        <UserFormDialog
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            user={editingUser}
            onSave={handleSave}
        />
    )}
    </>
  )
}
