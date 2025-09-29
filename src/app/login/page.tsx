"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Chrome, LogIn, Mail, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/shell/hooks/use-toast";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Los campos de correo y contraseña son obligatorios." });
      return;
    }
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al iniciar sesión", description: error.message });
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Introduce tu correo electrónico para restablecer la contraseña." });
      return;
    }
    try {
      await sendPasswordReset(email);
      toast({ title: "Correo enviado", description: "Se ha enviado un correo para restablecer tu contraseña." });
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error al restablecer la contraseña", description: error.message });
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md mt-20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Accede a la plataforma con tus credenciales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={signInWithGoogle} className="w-full">
            <Chrome className="mr-2 h-4 w-4" />
            Continuar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o continuar con</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
               <div className="flex justify-end">
                <Button variant="link" onClick={handlePasswordReset} className="h-auto p-0 text-xs text-muted-foreground">
                  ¿Has olvidado la contraseña?
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSignIn} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
