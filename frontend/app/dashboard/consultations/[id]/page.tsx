"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useConsultationStore } from "@/lib/stores/consultation-store"
import { StrategyViewer } from "@/components/dashboard/strategy-viewer"
import { ChartSection } from "@/components/dashboard/chart-section"
import { FeedbackForm } from "@/components/dashboard/feedback-form"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  MapPin,
  Users,
  DollarSign,
  Target,
  Trash2,
} from "lucide-react"
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
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

function ConsultationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card className="glass-card">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchConsultationById, currentConsultation, isLoading, deleteConsultation } = useConsultationStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchConsultationById(params.id as string)
    }
  }, [params.id, fetchConsultationById])

  // Auto-refresh for processing consultations
  useEffect(() => {
    if (currentConsultation?.status === "processing") {
      const interval = setInterval(() => {
        fetchConsultationById(params.id as string)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentConsultation?.status, params.id, fetchConsultationById])

  const handleCopyStrategy = () => {
    if (currentConsultation?.refinedStrategy) {
      navigator.clipboard.writeText(currentConsultation.refinedStrategy)
      toast.success("Strategy copied to clipboard!")
    }
  }

  const handleExportPDF = async () => {
    if (!currentConsultation) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/consultations/${currentConsultation.id}/export/pdf`)
      if (!response.ok) throw new Error("Failed to generate PDF")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `consultation-${currentConsultation.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      toast.error("Failed to export PDF")
    }
  }

  const handleShare = async () => {
    if (!currentConsultation) return
    
    const url = `${window.location.origin}/dashboard/consultations/${currentConsultation.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Consultation: ${currentConsultation.business.name}`,
          text: `Check out this business consultation: ${currentConsultation.goal}`,
          url,
        })
        toast.success("Shared successfully!")
      } catch (error) {
        // User cancelled or error
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("Failed to share")
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleDelete = async () => {
    if (!currentConsultation) return
    
    setIsDeleting(true)
    try {
      await deleteConsultation(currentConsultation.id)
      toast.success("Consultation deleted successfully")
      router.push("/dashboard/consultations")
    } catch (error) {
      toast.error("Failed to delete consultation")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading || !currentConsultation) {
    return <ConsultationSkeleton />
  }

  const status = statusConfig[currentConsultation.status]
  const plan = planConfig[currentConsultation.plan]
  const StatusIcon = status.icon

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentConsultation.business.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{currentConsultation.business.type}</span>
                <span>•</span>
                <span className="capitalize">{currentConsultation.business.stage}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("gap-1", status.className)}>
            <StatusIcon className={cn("h-3 w-3", status.iconClassName)} />
            {status.label}
          </Badge>
          <Badge variant="outline" className={cn(plan.className)}>
            {plan.label}
          </Badge>
        </div>
      </div>

      {/* Processing State */}
      {currentConsultation.status === "processing" && (
        <Card className="glass-card border-blue-500/30">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating Your Strategy</h3>
            <p className="text-muted-foreground mb-4">
              Our AI is analyzing your business data and crafting personalized recommendations...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Auto-refreshing...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Content */}
      {currentConsultation.status === "completed" && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="grid w-full md:w-auto grid-cols-5 bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="visualizations">Charts</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyStrategy} className="bg-transparent">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-transparent text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Consultation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this consultation? This action cannot be undone and all associated data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Business Info */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{currentConsultation.business.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team Size</p>
                      <p className="font-medium">{currentConsultation.business.teamSize} people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="font-medium">{formatCurrency(currentConsultation.financial.monthlyRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Target Revenue</p>
                      <p className="font-medium">{formatCurrency(currentConsultation.financial.targetRevenue || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goal */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Primary Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{currentConsultation.goal}</p>
                {currentConsultation.financial.otherGoals && currentConsultation.financial.otherGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentConsultation.financial.otherGoals.map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Consultation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(currentConsultation.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Processing Time</p>
                      <p className="font-medium">{currentConsultation.processingTime || 0}s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Refinements</p>
                      <p className="font-medium">{currentConsultation.refinementCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{currentConsultation.modelUsed || "GPT-4o"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy">
            <StrategyViewer content={currentConsultation.refinedStrategy} />
          </TabsContent>

          <TabsContent value="visualizations">
            <ChartSection data={currentConsultation.visualizationData} />
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Consultation History</CardTitle>
                <CardDescription>Timeline of events for this consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full gradient-primary" />
                      <div className="w-0.5 h-full bg-border" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Consultation Created</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentConsultation.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full gradient-primary" />
                      <div className="w-0.5 h-full bg-border" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Strategy Generated</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentConsultation.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {currentConsultation.refinementCount > 0 && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full gradient-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Refinements Applied</p>
                        <p className="text-sm text-muted-foreground">{currentConsultation.refinementCount} rounds</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackForm consultationId={currentConsultation.id} existingFeedback={currentConsultation.feedback} />
          </TabsContent>
        </Tabs>
      )}

      {/* Failed State */}
      {currentConsultation.status === "failed" && (
        <Card className="glass-card border-red-500/30">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Consultation Failed</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong while processing your consultation. Please try again.
            </p>
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link href="/dashboard/new-consultation">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
