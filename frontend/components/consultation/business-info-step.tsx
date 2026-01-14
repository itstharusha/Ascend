"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, MapPin, Users, Briefcase } from "lucide-react"
import type { BusinessStageOption } from "@/lib/api/meta"

interface BusinessInfoData {
  businessName: string
  businessType: string
  businessStage: string
  location: string
  teamSize: number
  industry: string
}

interface BusinessInfoStepProps {
  data: BusinessInfoData
  onChange: (data: BusinessInfoData) => void
  industries: string[]
  businessStages: BusinessStageOption[]
}

export function BusinessInfoStep({ data, onChange, industries, businessStages }: BusinessInfoStepProps) {
  const updateField = <K extends keyof BusinessInfoData>(field: K, value: BusinessInfoData[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Business Type *</Label>
          <Input
            placeholder="e.g., specialty coffee shop, SaaS platform, consulting firm"
            value={data.businessType}
            onChange={(e) => updateField("businessType", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Describe your business type</p>
        </div>

        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Business Name
          </Label>
          <Input
            id="businessName"
            placeholder="e.g., TechFlow AI (optional)"
            value={data.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Industry
          </Label>
          <Select value={data.industry} onValueChange={(value) => updateField("industry", value)}>
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry (optional)" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Stage */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Business Stage *</Label>
          <Select value={data.businessStage} onValueChange={(value) => updateField("businessStage", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {businessStages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location
          </Label>
          <Input
            id="location"
            placeholder="e.g., San Francisco, CA (optional)"
            value={data.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>

        {/* Team Size */}
        <div className="space-y-2">
          <Label htmlFor="teamSize" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Size
          </Label>
          <Input
            id="teamSize"
            type="number"
            min={0}
            placeholder="e.g., 10 (optional)"
            value={data.teamSize || ""}
            onChange={(e) => updateField("teamSize", Number.parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )
}
