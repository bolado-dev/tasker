"use client"

import * as React from "react"
import { ChefHat, Clock, Heart, Pencil, Plus, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { EmptyState } from "@/components/empty-state"
import { RecipeDialog } from "@/components/dialogs/recipe-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Recipe } from "@/lib/types"
import type { Store } from "@/lib/store-types"

export function RecipesView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Recipe | null>(null)
  const [reading, setReading] = React.useState<Recipe | null>(null)
  const [tab, setTab] = React.useState<"all" | "favorites">("all")
  const [query, setQuery] = React.useState("")

  function save(r: Recipe) {
    store.setRecipes((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id)
      if (idx === -1) return [...prev, r]
      const copy = [...prev]
      copy[idx] = r
      return copy
    })
  }

  function remove(id: string) {
    store.setRecipes((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleFavorite(r: Recipe) {
    save({ ...r, favorite: !r.favorite })
  }

  const q = query.trim().toLowerCase()
  const filtered = store.recipes
    .filter((r) => (tab === "favorites" ? r.favorite : true))
    .filter((r) => {
      if (!q) return true
      if (r.title.toLowerCase().includes(q)) return true
      if (r.description?.toLowerCase().includes(q)) return true
      if (r.tags.some((t) => t.toLowerCase().includes(q))) return true
      if (r.ingredients.some((i) => i.toLowerCase().includes(q))) return true
      return false
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="favorites">Favoritas</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} />
        </Tabs>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar recetas, ingredientes, etiquetas…"
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus />
            Nueva
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={
            store.recipes.length === 0
              ? "Sin recetas todavía"
              : "Nada coincide"
          }
          description={
            store.recipes.length === 0
              ? "Cocinar es un buen ancla. Empieza con una que ya hagas bien."
              : "Cambia el filtro o la búsqueda."
          }
          action={
            store.recipes.length === 0 ? (
              <Button
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                <Plus />
                Crear receta
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const total = (r.prepMin ?? 0) + (r.cookMin ?? 0)
            return (
              <Card
                key={r.id}
                className="lift-on-hover cursor-pointer overflow-hidden"
              >
                {r.imageUrl ? (
                  <div
                    className="h-32 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${r.imageUrl})` }}
                  />
                ) : (
                  <div className="bg-muted/60 from-primary/10 to-muted relative h-32 bg-gradient-to-br">
                    <ChefHat className="text-muted-foreground/30 absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                )}
                <CardContent>
                  <button
                    type="button"
                    onClick={() => setReading(r)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading flex-1 truncate text-base font-semibold">
                        {r.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(r)
                        }}
                        aria-label={
                          r.favorite ? "Quitar favorita" : "Marcar favorita"
                        }
                        className="text-muted-foreground hover:text-rose-500 hover:scale-110 active:scale-95 cursor-pointer transition-all"
                      >
                        <Heart
                          className={r.favorite ? "fill-rose-500 text-rose-500" : ""}
                        />
                      </button>
                    </div>
                    {r.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {total > 0 && (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {total} min
                        </span>
                      )}
                      {r.servings && (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Users className="size-3" />
                          {r.servings}
                        </span>
                      )}
                    </div>
                    {r.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="bg-muted text-muted-foreground border-transparent text-[10px]"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(r)
                        setOpen(true)
                      }}
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RecipeDialog
        open={open}
        onOpenChange={setOpen}
        recipe={editing}
        onSave={save}
        onDelete={remove}
      />

      <Dialog
        open={!!reading}
        onOpenChange={(v) => {
          if (!v) setReading(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {reading && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{reading.title}</DialogTitle>
                {reading.description && (
                  <DialogDescription>{reading.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                {reading.prepMin != null && (
                  <span>Prep: {reading.prepMin} min</span>
                )}
                {reading.cookMin != null && (
                  <span>Cocción: {reading.cookMin} min</span>
                )}
                {reading.servings != null && <span>{reading.servings} porciones</span>}
              </div>
              {reading.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reading.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="bg-muted text-muted-foreground border-transparent"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
                <div>
                  <h4 className="font-heading mb-2 text-sm font-semibold">
                    Ingredientes
                  </h4>
                  <ul className="space-y-1.5 text-sm">
                    {reading.ingredients.map((i, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-muted-foreground/60">·</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-heading mb-2 text-sm font-semibold">Pasos</h4>
                  <ol className="space-y-3 text-sm">
                    {reading.steps.map((s, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const r = reading
                    setReading(null)
                    setEditing(r)
                    setOpen(true)
                  }}
                >
                  <Pencil />
                  Editar
                </Button>
                <Button onClick={() => setReading(null)}>Cerrar</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
