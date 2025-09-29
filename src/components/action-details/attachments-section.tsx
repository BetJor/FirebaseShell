"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/shell/hooks/use-toast"
import { uploadFileAndUpdateAction, getActionById } from "@/lib/data"
import type { ImprovementAction } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Paperclip, Upload, Download, Loader2, ChevronRight } from "lucide-react"
import { Badge } from "../ui/badge"
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface AttachmentsSectionProps {
  action: ImprovementAction
  onActionUpdate: (updatedAction: ImprovementAction) => void;
}

export function AttachmentsSection({ action, onActionUpdate }: AttachmentsSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const safeUpload = async (file: File) => {
    // Use a promise to wait for authentication to be confirmed
    return new Promise<void>((resolve, reject) => {
      // onAuthStateChanged is the most reliable way to check the auth state
      const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
        // Unsubscribe immediately to avoid memory leaks
        unsubscribe();
  
        if (user) {
          console.log("[Attachments] Auth confirmed, starting upload.");
          try {
            await uploadFileAndUpdateAction(action.id, file, {
              id: user.uid, // Use the user ID from the SDK
              name: user.displayName || 'Unknown User',
              avatar: user.photoURL || undefined,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("No authenticated user found."));
        }
      });
    });
  };
  

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("--- [Attachments] handleFileChange triggered ---");
    const file = event.target.files?.[0]
    if (!file || !user) {
        console.error("[Attachments] No file or user. File:", file, "User:", user);
        return;
    }

    console.log(`[Attachments] File selected: ${file.name}, User: ${user.id}`);
    setIsUploadingFile(true)
    try {
      console.log("[Attachments] Calling safeUpload...");
      await safeUpload(file);
      console.log("[Attachments] safeUpload completed successfully.");
      toast({
        title: "Archivo subido",
        description: `${file.name} se ha subido y adjuntado correctamente.`,
      });
   
      console.log("[Attachments] Fetching updated action...");
      const updatedAction = await getActionById(action.id)
      if (updatedAction) {
        console.log("[Attachments] Action updated, calling onActionUpdate.");
        onActionUpdate(updatedAction)
      } else {
        console.warn("[Attachments] Updated action not found after upload.");
      }

    } catch (error) {
      console.error("[Attachments] Error during upload process:", error);
      toast({
        variant: "destructive",
        title: "Error de subida",
        description: "No se ha podido subir el archivo.",
      })
    } finally {
      console.log("--- [Attachments] Finally block. Resetting state. ---");
      setIsUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card>
      <Collapsible>
        <div className="flex justify-between items-center p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-5 w-5" />
            Adjuntos
          </CardTitle>
          <div className="flex items-center gap-2">
              <Badge variant="secondary">{(action.attachments || []).length}</Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="data-[state=open]:rotate-90">
                    <ChevronRight className="h-4 w-4 transition-transform" />
                </Button>
              </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                      <p className="text-xs text-muted-foreground">PDF, PNG, JPG, DOCX...</p>
                    </>
                  )}
                </div>
                <Input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isUploadingFile}
                />
              </label>
            </div>
            <div className="space-y-2">
              {(action.attachments && action.attachments.length > 0) ? (
                action.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="h-4 w-4 shrink-0" />
                            <span className="truncate text-sm">{file.fileName}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{file.fileName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" download={file.fileName}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 w-full">Aún no hay archivos adjuntos.</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
