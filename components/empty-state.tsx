"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type Props = {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="bg-primary/10 text-primary animate-pop flex size-14 items-center justify-center rounded-3xl">
          <Icon className="size-6" />
        </div>
        <div className="max-w-sm space-y-1.5">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {action && <div className="mt-1">{action}</div>}
      </CardContent>
    </Card>
  )
}
