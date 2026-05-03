"use client"

import * as React from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone)
}

function subscribeStandalone(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const mq = window.matchMedia("(display-mode: standalone)")
  mq.addEventListener("change", cb)
  window.addEventListener("appinstalled", cb)
  return () => {
    mq.removeEventListener("change", cb)
    window.removeEventListener("appinstalled", cb)
  }
}

export function InstallButton() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null)
  const installed = React.useSyncExternalStore(
    subscribeStandalone,
    isStandalone,
    () => false,
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return
    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setDeferred(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  if (installed || !deferred) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleInstall}
          aria-label="Instalar app"
        >
          <Download />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Instalar como app</TooltipContent>
    </Tooltip>
  )
}
