"use client"

import * as React from "react"

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // ignore registration errors
      })
    }
    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })
    return () => window.removeEventListener("load", onLoad)
  }, [])
  return null
}
