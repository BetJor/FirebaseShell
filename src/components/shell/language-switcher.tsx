
"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("es");

  return (
    <div className="grid gap-2">
      <Label htmlFor="language-select">Selecciona un idioma</Label>
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger id="language-select">
          <SelectValue placeholder="Selecciona un idioma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="ca" disabled>Catalán (deshabilitado)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
