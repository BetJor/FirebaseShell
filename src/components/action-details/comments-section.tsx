"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/shell/hooks/use-toast"
import { updateAction, getActionById } from "@/lib/data"
import type { ImprovementAction, ActionComment } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MessageSquare, Send, Loader2, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface CommentsSectionProps {
  action: ImprovementAction
  onActionUpdate: (updatedAction: ImprovementAction) => void;
}

export function CommentsSection({ action, onActionUpdate }: CommentsSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setIsSubmittingComment(true)

    const commentToAdd: ActionComment = {
      id: crypto.randomUUID(),
      author: {
        id: user.id,
        name: user.name || 'Unknown User',
        avatar: user.avatar || undefined,
      },
      date: new Date().toISOString(),
      text: newComment,
    }

    try {
      await updateAction(action.id, { newComment: commentToAdd })
      toast({
        title: "Comentario añadido",
        description: "Tu comentario se ha guardado correctamente.",
      })
      setNewComment("")
      const updatedAction = await getActionById(action.id)
      if (updatedAction) onActionUpdate(updatedAction)
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido añadir el comentario.",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Card>
      <Collapsible>
        <div className="flex justify-between items-center p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" />
            Comentarios
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{(action.comments || []).length}</Badge>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="data-[state=open]:rotate-90">
                    <ChevronRight className="h-4 w-4 transition-transform" />
                </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {(action.comments || []).length > 0 ? (
                action.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      {comment.author.avatar && <AvatarImage src={comment.author.avatar} />}
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">{comment.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md mt-1 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aún no hay comentarios.</p>
              )}
            </div>
            <form onSubmit={handleCommentSubmit} className="relative pt-4">
              <Textarea
                placeholder="Añade un comentario..."
                className="pr-10"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
              />
              <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" disabled={isSubmittingComment || !newComment.trim()}>
                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
