"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Target, Plus, X } from "lucide-react"

interface FinancialData {
  monthlyRevenue: number
  monthlyExpenses: number
  mainGoal: string
  otherGoals: string[]
  targetRevenue: number
}

interface FinancialStepProps {
  data: FinancialData
  onChange: (data: FinancialData) => void
  suggestedGoals: string[]
}

export function FinancialStep({ data, onChange, suggestedGoals }: FinancialStepProps) {
  const [newGoal, setNewGoal] = useState("")

  const updateField = <K extends keyof FinancialData>(field: K, value: FinancialData[K]) => {
    onChange({ ...data, [field]: value })
  }

  const addGoal = (goal: string) => {
    if (goal && !data.otherGoals.includes(goal)) {
      updateField("otherGoals", [...data.otherGoals, goal])
    }
    setNewGoal("")
  }

  const removeGoal = (goal: string) => {
    updateField(
      "otherGoals",
      data.otherGoals.filter((g) => g !== goal),
    )
  }

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
      {/* Financial Inputs */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="monthlyRevenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Monthly Revenue
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="monthlyRevenue"
              type="number"
              min={0}
              className="pl-7"
              placeholder="0"
              value={data.monthlyRevenue || ""}
              onChange={(e) => updateField("monthlyRevenue", Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">{formatCurrency(data.monthlyRevenue)}/month</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyExpenses" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            Monthly Expenses
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="monthlyExpenses"
              type="number"
              min={0}
              className="pl-7"
              placeholder="0"
              value={data.monthlyExpenses || ""}
              onChange={(e) => updateField("monthlyExpenses", Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">{formatCurrency(data.monthlyExpenses)}/month</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetRevenue" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Target Revenue
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="targetRevenue"
              type="number"
              min={0}
              className="pl-7"
              placeholder="0"
              value={data.targetRevenue || ""}
              onChange={(e) => updateField("targetRevenue", Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Goal: {formatCurrency(data.targetRevenue)}/month</p>
        </div>
      </div>

      {/* Profit/Loss Indicator */}
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monthly Profit/Loss</span>
          <span
            className={`text-lg font-bold ${data.monthlyRevenue - data.monthlyExpenses >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {formatCurrency(data.monthlyRevenue - data.monthlyExpenses)}
          </span>
        </div>
      </div>

      {/* Main Goal */}
      <div className="space-y-2">
        <Label htmlFor="mainGoal">Primary Business Goal *</Label>
        <Textarea
          id="mainGoal"
          placeholder="What's the main objective you want to achieve? e.g., Scale to $200K MRR within 12 months"
          value={data.mainGoal}
          onChange={(e) => updateField("mainGoal", e.target.value)}
          rows={3}
        />
      </div>

      {/* Other Goals */}
      <div className="space-y-3">
        <Label>Secondary Goals (Optional)</Label>
        <div className="flex flex-wrap gap-2">
          {suggestedGoals
            .filter((g) => !data.otherGoals.includes(g))
            .map((goal) => (
              <Badge
                key={goal}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => addGoal(goal)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {goal}
              </Badge>
            ))}
        </div>

        {/* Selected Goals */}
        {data.otherGoals.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.otherGoals.map((goal) => (
              <Badge key={goal} className="gradient-primary text-primary-foreground">
                {goal}
                <button className="ml-1 hover:text-white/80" onClick={() => removeGoal(goal)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Custom Goal Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a custom goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal(newGoal)}
          />
          <Button variant="outline" onClick={() => addGoal(newGoal)} disabled={!newGoal} className="bg-transparent">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
