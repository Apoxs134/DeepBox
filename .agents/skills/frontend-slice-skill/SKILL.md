---
name: frontend-slice-skill
description: >-
  Enforces Feature-Sliced Architecture principles for modern frontend development (React, TypeScript).
  Mandates colocation of UI components, slice-specific state/hooks, API queries/mutations, and DTO contracts
  inside dedicated feature directories. Strictly prohibits importing private internals or state from sibling feature slices.
---

# Frontend Feature-Sliced Architecture Skill

This skill enforces best practices and structural boundaries for modern frontend applications (React, TypeScript) using **Feature-Sliced Architecture**.

---

## 1. Core Philosophy

Frontend code is organized around business features rather than horizontal technical layers. Instead of dumping files into global `components/`, `hooks/`, `types/`, and `services/` folders, every feature encapsulates all of its UI, state, API queries, and contracts in a self-contained feature slice.

```
Monolithic / Layered (High Coupling)         Feature-Sliced (High Cohesion, Clear Boundaries)
src/                                         src/features/
├── components/ (all mixed together)         ├── items/
├── hooks/      (all mixed together)         │   ├── api/          (endpoints & fetchers)
├── types/      (all mixed together)         │   ├── components/   (slice-specific UI)
└── services/   (all mixed together)         │   ├── hooks/        (slice state & behavior)
                                             │   ├── types.ts      (slice DTOs & contracts)
                                             │   └── index.ts      (public API boundary)
                                             └── orders/
                                                 ├── api/
                                                 ├── components/
                                                 ├── hooks/
                                                 ├── types.ts
                                                 └── index.ts
```

---

## 2. Hard Architectural Rules

### Rule 1: Strict Colocation
Everything needed to render, operate, and manage a feature must live inside its feature directory (`src/features/<feature-name>/`):
- **UI Components**: Components specifically designed for this feature (e.g., `ItemList.tsx`, `ItemForm.tsx`).
- **State & Hooks**: Slice-level state, custom hooks, and interaction logic (e.g., `useItems.ts`).
- **Data Access & API**: API clients, fetchers, queries, and mutations (e.g., `itemsApi.ts`).
- **Contracts & DTOs**: TypeScript interfaces and types for the feature's inputs and outputs (e.g., `types.ts`).
- **Tests**: Vitest / Testing Library tests colocated in `__tests__/` or `tests/`.

### Rule 2: Strictly Forbid Importing Private State from Sibling Slices
- **NEVER** reach into the internal implementation of a sibling slice:
  - ❌ `import { useItemSelection } from '../items/hooks/useItemSelection'` inside `orders`
  - ❌ `import { ItemRowInternal } from '../items/components/ItemRowInternal'` inside `orders`
- **Private Internals**: Any hook, component, or helper not explicitly exposed through the slice's `index.ts` is considered **private** and strictly inaccessible to other features.
- If Feature A needs data produced by Feature B, orchestrate them at the **page/app layer** or communicate via URL state, domain events, or explicit public contracts.

### Rule 3: Public API Boundary (`index.ts`)
Each feature slice must maintain an explicit public gateway file (`index.ts`):
- Only components, hooks, or DTOs intended for external consumption are exported.
- Sibling features or pages may **only** import from the feature's public entry point:
  - ✅ `import { ItemList, type Item } from '@/features/items'`
  - ❌ `import { ItemList } from '@/features/items/components/ItemList'`

### Rule 4: Duplication Over Cross-Slice Coupling
- If two slices require a similar UI helper, formatting function, or DTO shape, **duplicate it** within each slice.
- Do **NOT** create a shared pseudo-feature or cross-import types just to avoid writing a 5-line type or helper twice.
- Sharing creates hidden coupling: updating the helper for Feature A unexpectedly breaks Feature B.

### Rule 5: Pure Shared Primitives
Code placed in global `shared/` or `components/ui/` must satisfy:
- **Zero domain knowledge**: Must not know anything about items, orders, payments, users, or business rules.
- Pure reusable primitives only (e.g., generic `Button`, `Modal`, `Input`, `Spinner`, HTTP client base instance).

---

## 3. Canonical Directory Structure

```
src/features/<feature-name>/
├── api/
│   └── <feature>Api.ts         # Query functions, mutations, and fetch wrappers
├── components/
│   ├── <ComponentA>.tsx        # Feature-specific UI components
│   └── <ComponentB>.tsx
├── hooks/
│   └── use<Feature>.ts         # Slice state management and lifecycle hooks
├── types.ts                    # DTO contracts, domain types, and input models
├── index.ts                    # Public API barrel (exports ONLY what is public)
└── __tests__/
    └── <feature>.test.tsx      # Colocated feature tests
```

---

## 4. Canonical Feature Slice Example

### 1. `types.ts` (Contracts)
```typescript
export interface Item {
  id: number
  name: string
  unitPrice: number
  isAvailable: boolean
}

export interface CreateItemDto {
  name: string
  unitPrice: number
  isAvailable?: boolean
}
```

### 2. `api/itemsApi.ts` (Data Access)
```typescript
import type { Item, CreateItemDto } from '../types'

const BASE_URL = '/api/items'

export async function getItems(): Promise<Item[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Failed to fetch items')
  return res.json()
}

export async function createItem(dto: CreateItemDto): Promise<Item> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error('Failed to create item')
  return res.json()
}
```

### 3. `hooks/useItems.ts` (Slice State & Hook)
```typescript
import { useState, useEffect, useCallback } from 'react'
import type { Item, CreateItemDto } from '../types'
import { getItems, createItem } from '../api/itemsApi'

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getItems()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (dto: CreateItemDto) => {
    const created = await createItem(dto)
    setItems((prev) => [...prev, created])
    return created
  }

  return { items, loading, reload: load, addItem: add }
}
```

### 4. `components/ItemList.tsx` (Colocated UI)
```typescript
import type { Item } from '../types'

interface ItemListProps {
  items: Item[]
  onSelect?: (item: Item) => void
}

export function ItemList({ items, onSelect }: ItemListProps) {
  return (
    <ul className="divide-y divide-slate-800">
      {items.map((item) => (
        <li key={item.id} className="py-2 flex justify-between items-center">
          <span>{item.name}</span>
          <span className="font-semibold">${item.unitPrice.toFixed(2)}</span>
          {onSelect && (
            <button onClick={() => onSelect(item)} className="text-xs px-2 py-1 bg-blue-600 rounded">
              Select
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
```

### 5. `index.ts` (Strict Public API Boundary)
```typescript
// Explicit public interface of the items slice
export { ItemList } from './components/ItemList'
export { useItems } from './hooks/useItems'
export type { Item, CreateItemDto } from './types'

// Internal hooks and private sub-components are intentionally NOT exported here
```

---

## 5. Anti-Patterns to Flag & Prohibit

| Anti-Pattern | Why It Is Prohibited | Proper Alternative |
| :--- | :--- | :--- |
| **Cross-Slice Private Import** (`import { useX } from '../featureA/hooks/internal'`) | Tightly couples features and breaks independent refactoring. | Communicate via page orchestration or export an explicit public interface in `index.ts`. |
| **Global Feature Junk Drawer** (`src/hooks/useItemDetails.ts`) | Destroys colocation and hides domain boundaries. | Move inside `src/features/items/hooks/`. |
| **Domain Logic in Shared UI** (`components/ui/ProductCard.tsx`) | Shared UI primitives must remain generic and domain-agnostic. | Move to `features/items/components/` or make the card a generic `Card` primitive. |
| **Cross-Slice State Mutation** | Slices mutating state owned by another slice causes unpredictable renders and race conditions. | Use explicit callback props or state lifting to the consuming page. |
