import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Consultation } from "@/types/consultation"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight, Building2, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConsultationCardProps {
  consultation: Consultation
}

const statusConfig = {
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    iconClassName: "animate-spin",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    iconClassName: "",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
    iconClassName: "",
  },
}

const planConfig = {
  basic: { label: "Basic", className: "bg-muted text-muted-foreground" },
  premium: { label: "Premium", className: "bg-primary/10 text-primary" },
  ultra: { label: "Ultra", className: "gradient-primary text-primary-foreground" },
}

export function ConsultationCard({ consultation }: ConsultationCardProps) {
  const status = statusConfig[consultation.status]
  const plan = planConfig[consultation.plan]
  const StatusIcon = status.icon

  return (
    <Card className="glass-card hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold truncate max-w-[200px]">{consultation.business.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {consultation.business.type} • {consultation.business.stage}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0", plan.className)}>
            {plan.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{consultation.goal}</p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={cn("gap-1", status.className)}>
            <StatusIcon className={cn("h-3 w-3", status.iconClassName)} />
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="ml-auto group-hover:text-primary" asChild>
          <Link href={`/dashboard/consultations/${consultation.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
