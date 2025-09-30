
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(1, "El nom és requerit."),
  email: z.string().email("L'adreça de correu no és vàlida."),
  role: z.enum(["Creator", "Responsible", "Director", "Committee", "Admin", "User"], {
    required_error: "El rol és requerit.",
  }),
  avatar: z.string().url("La URL de l'avatar no és vàlida.").optional().or(z.literal('')),
})

type UserFormValues = z.infer<typeof formSchema>

interface UserFormDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  user: User | null
  onSave: (data: Omit<User, "id">, id?: string) => Promise<void>
}

export function UserFormDialog({
  isOpen,
  setIsOpen,
  user,
  onSave,
}: UserFormDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "User",
      avatar: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset(user)
    } else {
      form.reset({
        name: "",
        email: "",
        role: "User",
        avatar: "",
      })
    }
  }, [user, form])

  const handleSubmit = (values: UserFormValues) => {
    onSave(values, user?.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuari" : "Crear Nou Usuari"}</DialogTitle>
          <DialogDescription>
            {user ? "Modifica les dades de l'usuari." : "Omple les dades per a crear un nou usuari."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ex., Joan Pere" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correu Electrònic</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="p. ex., joan.pere@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Creator">Creator</SelectItem>
                      <SelectItem value="Responsible">Responsible</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Committee">Committee</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'Avatar</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel·lar</Button>
              </DialogClose>
              <Button type="submit">Desar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
