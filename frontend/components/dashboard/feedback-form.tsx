"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useConsultationStore } from "@/lib/stores/consultation-store"
import type { ConsultationFeedback } from "@/types/consultation"
import { Star, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"

interface FeedbackFormProps {
  consultationId: string
  existingFeedback?: ConsultationFeedback
}

export function FeedbackForm({ consultationId, existingFeedback }: FeedbackFormProps) {
  const { submitFeedback } = useConsultationStore()
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 0)
  const [comment, setComment] = useState(existingFeedback?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(!!existingFeedback)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      await submitFeedback(consultationId, rating as 1 | 2 | 3 | 4 | 5, comment)
      setIsSubmitted(true)
      toast.success("Thank you for your feedback!")
    } catch (error) {
      toast.error("Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted && existingFeedback) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You for Your Feedback!</h3>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-6 w-6",
                  star <= existingFeedback.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground",
                )}
              />
            ))}
          </div>
          {existingFeedback.comment && (
            <p className="text-muted-foreground italic">&quot;{existingFeedback.comment}&quot;</p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Submitted on {format(new Date(existingFeedback.createdAt), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Rate This Consultation</CardTitle>
        <CardDescription>Your feedback helps us improve our AI recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">How helpful was this consultation?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-400",
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {rating === 0 && "Click to rate"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="feedback-comment" className="text-sm font-medium">
            Additional Comments (Optional)
          </label>
          <Textarea
            id="feedback-comment"
            placeholder="Share your thoughts about the consultation..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full gradient-primary text-primary-foreground"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
