"use client"

import * as React from "react"
import { Heart, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Recipe } from "@/lib/types"
import { uid } from "@/lib/storage"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  recipe?: Recipe | null
  onSave: (r: Recipe) => void
  onDelete?: (id: string) => void
}

export function RecipeDialog(props: Props) {
  const { open, onOpenChange, recipe } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && <RecipeForm key={recipe?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function RecipeForm({ onOpenChange, recipe, onSave, onDelete }: Props) {
  const [title, setTitle] = React.useState(recipe?.title ?? "")
  const [description, setDescription] = React.useState(recipe?.description ?? "")
  const [ingredients, setIngredients] = React.useState<string[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [""],
  )
  const [steps, setSteps] = React.useState<string[]>(
    recipe?.steps?.length ? recipe.steps : [""],
  )
  const [tagsRaw, setTagsRaw] = React.useState((recipe?.tags ?? []).join(", "))
  const [prepMin, setPrepMin] = React.useState<string>(
    recipe?.prepMin?.toString() ?? "",
  )
  const [cookMin, setCookMin] = React.useState<string>(
    recipe?.cookMin?.toString() ?? "",
  )
  const [servings, setServings] = React.useState<string>(
    recipe?.servings?.toString() ?? "",
  )
  const [imageUrl, setImageUrl] = React.useState(recipe?.imageUrl ?? "")
  const [favorite, setFavorite] = React.useState(Boolean(recipe?.favorite))

  function handleSave() {
    const t = title.trim()
    if (!t) return
    const cleanIngredients = ingredients.map((s) => s.trim()).filter(Boolean)
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)
    const tags = tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const next: Recipe = recipe
      ? {
          ...recipe,
          title: t,
          description: description.trim() || undefined,
          ingredients: cleanIngredients,
          steps: cleanSteps,
          tags,
          prepMin: prepMin ? Number(prepMin) : undefined,
          cookMin: cookMin ? Number(cookMin) : undefined,
          servings: servings ? Number(servings) : undefined,
          imageUrl: imageUrl.trim() || undefined,
          favorite,
        }
      : {
          id: uid(),
          title: t,
          description: description.trim() || undefined,
          ingredients: cleanIngredients,
          steps: cleanSteps,
          tags,
          prepMin: prepMin ? Number(prepMin) : undefined,
          cookMin: cookMin ? Number(cookMin) : undefined,
          servings: servings ? Number(servings) : undefined,
          imageUrl: imageUrl.trim() || undefined,
          favorite,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  function updateAt(arr: string[], i: number, v: string) {
    const c = [...arr]
    c[i] = v
    return c
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{recipe ? "Editar receta" : "Nueva receta"}</DialogTitle>
        <DialogDescription>
          Comer bien también es ocupar tu tiempo. Guarda lo que ya te funciona.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
        <div className="grid gap-2">
          <Label htmlFor="rec-title">Título</Label>
          <Input
            id="rec-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Pollo al horno con verduras"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rec-desc">Descripción</Label>
          <Textarea
            id="rec-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Una línea sobre la receta…"
            rows={2}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="rec-prep">Prep (min)</Label>
            <Input
              id="rec-prep"
              type="number"
              min={0}
              value={prepMin}
              onChange={(e) => setPrepMin(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rec-cook">Cocción (min)</Label>
            <Input
              id="rec-cook"
              type="number"
              min={0}
              value={cookMin}
              onChange={(e) => setCookMin(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rec-serv">Porciones</Label>
            <Input
              id="rec-serv"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rec-tags">Etiquetas (separadas por coma)</Label>
          <Input
            id="rec-tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="rápido, vegetariano, alta-proteína"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rec-img">Imagen (URL opcional)</Label>
          <Input
            id="rec-img"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="grid gap-2">
          <Label>Ingredientes</Label>
          <div className="space-y-2">
            {ingredients.map((it, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={it}
                  onChange={(e) =>
                    setIngredients((prev) => updateAt(prev, i, e.target.value))
                  }
                  placeholder={`Ingrediente ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar"
                  onClick={() =>
                    setIngredients((prev) =>
                      prev.length === 1 ? [""] : prev.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIngredients((prev) => [...prev, ""])}
            >
              <Plus />
              Añadir ingrediente
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Pasos</Label>
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                  {i + 1}
                </span>
                <Textarea
                  rows={2}
                  value={s}
                  onChange={(e) =>
                    setSteps((prev) => updateAt(prev, i, e.target.value))
                  }
                  placeholder={`Paso ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.length === 1 ? [""] : prev.filter((_, j) => j !== i),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSteps((prev) => [...prev, ""])}
            >
              <Plus />
              Añadir paso
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant={favorite ? "default" : "outline"}
          onClick={() => setFavorite((f) => !f)}
        >
          <Heart className={favorite ? "fill-current" : ""} />
          {favorite ? "Favorita" : "Marcar favorita"}
        </Button>
      </div>

      <DialogFooter className="sm:justify-between">
        <div>
          {recipe && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(recipe.id)
                onOpenChange(false)
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogFooter>
    </>
  )
}
