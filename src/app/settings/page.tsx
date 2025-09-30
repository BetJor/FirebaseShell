"use client";

import { useTranslations } from "@/hooks/use-translations";

export default function SettingsPage() {
    const t = useTranslations("Settings");

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">
                {t("description")}
            </p>
            {/* Aquí anirà el contingut de la pàgina de configuració */}
        </div>
    );
}
