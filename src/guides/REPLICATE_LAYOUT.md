# Guia per a Replicar el Layout (App Shell)

Aquesta guia detalla els passos i components necessaris per a replicar l'estructura de layout i navegació per pestanyes (l'**App Shell**) d'aquesta aplicació a un altre projecte.

L'App Shell es compon de diversos elements que treballen junts: components de React, proveïdors de context (hooks), estils globals i fitxers de configuració.

## 1. Components del Layout (`src/components/shell`)

Aquesta és la base visual. Necessitaràs copiar la carpeta `src/components/shell` sencera, que inclou:

- **Components principals**:
  - `app-shell.tsx`: L'embolcall principal que estructura la capçalera, la barra lateral i l'àrea de contingut.
  - `header.tsx`: La barra de navegació superior.
  - `app-sidebar.tsx`: El menú de navegació lateral.
  - `dynamic-tabs.tsx`: El component que renderitza les pestanyes de navegació.
  - `floating-action-button.tsx`: El botó d'acció flotant.

- **Subdirectori `ui`**: Conté tots els components de baix nivell reutilitzats (com `sidebar.tsx`, `toaster.tsx`, etc.). És crucial copiar-lo sencer.

- **Subdirectori `hooks`**: Conté els hooks específics del layout.
  - `use-tabs.tsx`: El cor del sistema de pestanyes.
  - `use-mobile.tsx`: Per a detectar dispositius mòbils.
  - `use-toast.ts`: El sistema de notificacions (toasts).

## 2. Fitxer d'Entrada (`src/app/layout.tsx`)

Aquest fitxer és el punt d'entrada i on s'orquestra tot. La seva estructura és clau. Has d'assegurar-te que el teu `layout.tsx` embolcalli l'aplicació amb els proveïdors necessaris en l'ordre correcte.

```tsx
// src/app/layout.tsx

"use client";

// ... (imports) ...
import { AuthProvider } from "@/hooks/use-auth";
import { ActionStateProvider } from "@/hooks/use-action-state"; // O el teu proveïdor de dades principal
import { TabsProvider } from "@/components/shell/hooks/use-tabs";
import { AppShell } from "@/components/shell/app-shell";

// ... (component AppContent) ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ActionStateProvider> {/* Canvia'l pel teu proveïdor de dades si cal */}
            <TabsProvider initialTabs={[/*... la teva pestanya inicial ...*/]}>
              <AppContent>
                {children}
              </AppContent>
            </TabsProvider>
          </ActionStateProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

La jerarquia correcta dels proveïdors és fonamental.

## 3. Proveïdors de Context (Hooks)

El `shell` depèn d'altres hooks per a funcionar. Necessitaràs:

- **`src/hooks/use-auth.tsx`**: Proporciona la informació de l'usuari autenticat, essencial per a la capçalera i la barra lateral.
- **`src/hooks/use-action-state.tsx`**: Aquesta aplicació el fa servir per a gestionar l'estat global de les accions. La teva aplicació pot tenir un proveïdor de dades diferent, però el `layout.tsx` l'ha d'incloure.

## 4. Estils i Configuració de Tailwind

L'aparença del `shell` depèn directament dels estils globals i de la configuració de Tailwind.

- **`src/app/globals.css`**: Aquest fitxer conté totes les variables CSS del tema (colors de fons, primari, accent, etc.), incloses les variables específiques per a la barra lateral (`--sidebar-background`, `--sidebar-foreground`, etc.). Has de copiar el contingut d'aquest fitxer.

- **`tailwind.config.ts`**: La configuració de Tailwind ha de definir els colors personalitzats que s'utilitzen a `globals.css`, especialment l'objecte `sidebar`.

  ```ts
  // tailwind.config.ts
  extend: {
    colors: {
      // ... altres colors
      sidebar: {
        DEFAULT: 'hsl(var(--sidebar-background))',
        foreground: 'hsl(var(--sidebar-foreground))',
        // ... etc.
      },
    },
  }
  ```

- **`src/lib/utils.ts`**: Conté la funció `cn` per a combinar classes de Tailwind. És utilitzada per tots els components d'UI.

## 5. Configuració del Projecte

Finalment, assegura't que el teu projecte té les configuracions d'àlies correctes per a les rutes d'importació.

- **`tsconfig.json` o `jsconfig.json`**: Ha d'incloure els `paths` que fan servir els components per a les importacions (p. ex., `@/*`).

  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

- **`components.json`** (si fas servir ShadCN): També defineix àlies que han de coincidir.

---

### Resum de Fitxers i Carpetes a Copiar:

1.  Carpeta sencera: `src/components/shell/`
2.  Hook principal: `src/hooks/use-auth.tsx` (i adaptar-lo si cal).
3.  Fitxer de layout principal: `src/app/layout.tsx` (replicar-ne l'estructura).
4.  Fitxer d'estils: `src/app/globals.css`.
5.  Fitxer d'utilitats: `src/lib/utils.ts`.
6.  Fitxers de configuració: `tailwind.config.ts` i `tsconfig.json` (assegurar la coherència de la configuració).
