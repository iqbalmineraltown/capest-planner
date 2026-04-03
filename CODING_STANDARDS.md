# Coding Standards & Best Practices

This document defines the engineering standards for the Capest Planner project. All contributors must follow these guidelines.

---

## 1. Code Style Guide

### 1.1 TypeScript

- **Strict mode is enabled** (`"strict": true` in tsconfig). All code must pass strict type checking.
- **No `any` types.** Use `unknown` and type guards, or define proper interfaces. If you must use `any`, add a `// TODO: fix type` comment and a linked issue.
- **Use explicit return types** on exported functions and public store methods.
- **Use `interface` for object shapes**, `type` for unions, intersections, and utility types.
- **Use `import type`** for type-only imports to keep bundles clean.
  ```ts
  // Good
  import type { TeamMember } from '~/types'
  import { useMembersStore } from '~/stores/members'

  // Bad
  import { TeamMember } from '~/types'
  ```
- **Avoid non-null assertions (`!`).** Use optional chaining (`?.`) or null checks instead.
- **Use `as const`** for literal values that should be inferred narrowly.

### 1.2 Vue Components

- **Use `<script setup lang="ts">`** exclusively. No Options API.
- **One component per file.** File name must be PascalCase: `MemberCard.vue`.
- **Props:** Use `defineProps<T>()` with a TypeScript interface. Always declare prop types.
  ```vue
  <script setup lang="ts">
  interface Props {
    memberId: string
    editable?: boolean
  }
  const props = defineProps<Props>()
  </script>
  ```
- **Emits:** Use `defineEmits<T>()` with explicit event signatures.
  ```vue
  <script setup lang="ts">
  defineEmits<{
    'toggle-drawer': []
    'update': [value: string]
  }>()
  </script>
  ```
- **Reactive data:** Use `ref<T>()` with explicit type parameter for primitives and `reactive()` for form objects.
- **Computed properties:** Always type the return value when it's not obvious.
- **Template refs:** Use `ref<HTMLElement | null>(null)` with proper element types.

### 1.3 Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `MemberCard.vue` |
| Composables | camelCase with `use` prefix | `useCapacityCalc.ts` |
| Stores | camelCase | `members.ts` |
| Store composables | camelCase with `use` prefix | `useMembersStore()` |
| Utils | camelCase | `colorUtils.ts` |
| Types/Interfaces | PascalCase | `TeamMember`, `QuarterConfig` |
| Type aliases | PascalCase | `RoleType`, `QuarterAvailability` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_ROLES`, `STORAGE_KEY` |
| CSS classes | kebab-case with BEM-like prefix | `board-page__title`, `member-card--active` |
| Event names | kebab-case | `toggle-drawer`, `update:model-value` |
| Test files | Match source + `.test.ts` | `roles.test.ts` for `roles.ts` |

### 1.4 Imports

- **Use `~/` for project-relative imports.** Never use relative `../` paths for anything outside the same directory.
  ```ts
  // Good
  import { useMembersStore } from '~/stores/members'

  // Bad
  import { useMembersStore } from '../../stores/members'
  ```
- **Group imports** in this order, separated by blank lines:
  1. Vue/Nuxt core imports
  2. Third-party libraries
  3. Type imports
  4. Store/composable imports
  5. Utility imports
- **No `require()`.** Always use `import` syntax (ESM is the project type).

### 1.5 CSS / Styling

- **Use scoped CSS** (`<style scoped>`) in all components.
- **Use Vuetify theme tokens** for colors. Never hardcode hex values like `#fff`, `#1a1a2e`.
  ```scss
  // Good
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));

  // Bad
  background-color: #ffffff;
  color: #1a1a2e;
  ```
- **Dark theme must work.** Every component must be tested in both light and dark mode.
- **Use CSS custom properties** for component-specific theming when Vuetify tokens don't suffice.
- **Responsive design:** Use Vuetify's grid system and breakpoints. Test at 320px, 768px, and 1024px minimum.

### 1.6 Pinia Stores

- **Use the Composition API (setup) store pattern.** No Options API stores.
  ```ts
  export const useMembersStore = defineStore('members', () => {
    const members = ref<TeamMember[]>([])
    // ...
    return { members, addMember, removeMember }
  })
  ```
- **State:** Use `ref()` for reactive state.
- **Getters:** Use `computed()` properties. For parameterized getters, return a function from computed.
- **Actions:** Plain functions. Return meaningful values (`boolean`, `T | null`) rather than void when appropriate.
- **Persistence:** Wrap `localStorage.getItem()` / `JSON.parse()` in try/catch. Always handle parse failures gracefully.
- **Cross-store access:** Import and call other stores directly inside action functions, not at store definition time (to avoid circular dependency issues).

---

## 2. Code Review Checklist

Every pull request must pass this checklist before merging:

### Functionality
- [ ] Does the code do what the issue/task describes?
- [ ] Edge cases handled (empty data, null/undefined, large numbers)?
- [ ] No regressions in existing functionality?

### Type Safety
- [ ] No `any` types introduced (or justified with TODO)
- [ ] All functions have proper return types
- [ ] Props and emits are properly typed
- [ ] TypeScript strict mode passes (`npx nuxi typecheck`)

### Code Quality
- [ ] No duplicated code (DRY). Extract shared logic to composables or utils.
- [ ] No dead code, unused imports, or commented-out blocks
- [ ] Error handling present where needed (localStorage, API calls, JSON.parse)
- [ ] No hardcoded values that should be constants or config

### Styling
- [ ] No hardcoded hex colors — uses Vuetify theme tokens
- [ ] Scoped styles only
- [ ] Works in both light and dark themes
- [ ] Responsive at mobile (320px), tablet (768px), desktop (1024px+)

### Testing
- [ ] Unit tests added/updated for changed logic
- [ ] All existing tests still pass (`npm run test`)
- [ ] Tests follow existing patterns (see test conventions below)

### Performance
- [ ] No unnecessary re-renders or watchers
- [ ] Computed properties used instead of methods in templates where possible
- [ ] No memory leaks (cleanup intervals, event listeners in `onUnmounted`)

---

## 3. Documentation Requirements

### 3.1 Code Documentation

- **All exported functions, composables, and types must have JSDoc comments.**
  ```ts
  /**
   * Calculate capacity summary for a member in a given quarter
   * @param member - The team member to calculate for
   * @param initiatives - All initiatives (to find assignments)
   * @param quarterId - The quarter to calculate within
   * @returns MemberCapacity object or null if member not found
   */
  ```
- **Complex logic** must have inline comments explaining the "why", not the "what".
- **Store methods** should have brief JSDoc describing the action and return value.
- **TypeScript interfaces** must have JSDoc on each property (see `types/member.ts` for reference).

### 3.2 Component Documentation

- Each component should have a brief comment at the top of `<script setup>` describing its purpose if the name isn't self-explanatory.
- Props should be self-documenting via TypeScript types. Use JSDoc on the props interface if clarification is needed.

### 3.3 Project Documentation

- **README.md** must include: setup instructions, tech stack overview, scripts (`dev`, `test`, `build`).
- **This file (CODING_STANDARDS.md)** is the single source of truth for engineering standards.
- Significant architectural decisions should be documented in `docs/` or in relevant README sections.

### 3.4 Commit Messages

Use clear, imperative commit messages:
```
feat: add keyboard shortcuts for common actions
fix: resolve dark theme hardcoded colors in board
refactor: extract getInitials to shared colorUtils
test: add unit tests for capacity calculator
chore: update dependencies
```

Prefix with scope when helpful:
```
feat(board): add drag-and-drop for assignments
fix(members): handle duplicate name validation
```

---

## 4. Testing Standards

### 4.1 Unit Tests

- **Framework:** Vitest with `happy-dom` environment.
- **Location:** `tests/unit/` mirroring the source structure.
  ```
  stores/members.ts       → tests/unit/stores/members.test.ts
  utils/colorUtils.ts     → tests/unit/utils/colorUtils.test.ts
  composables/useToast.ts → tests/unit/composables/useToast.test.ts
  ```
- **Naming:** `describe('moduleName', () => {})` with nested `describe` blocks for grouping (e.g., `describe('addRole', () => {})`).
- **Test pattern:**
  ```ts
  import { describe, it, expect, beforeEach, vi } from 'vitest'

  describe('featureName', () => {
    beforeEach(() => {
      // Reset state, mock localStorage, create fresh pinia
    })

    describe('methodName', () => {
      it('should do X when Y', () => {
        // Arrange
        // Act
        // Assert
      })
    })
  })
  ```
- **Store tests:** Always create a fresh Pinia instance in `beforeEach`:
  ```ts
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })
  ```
- **Mock localStorage** in store tests. See `tests/unit/stores/roles.test.ts` for the reference pattern.

### 4.2 Test Coverage Expectations

- **Stores:** Test all public methods — happy path, edge cases, error handling.
- **Utils:** Test pure functions exhaustively — typical inputs, boundary values, empty/null inputs.
- **Composables:** Test through the store layer when possible. For standalone composables, use `@vue/test-utils` or direct mounting.
- **Components:** Integration-style tests for critical user flows. Not required for trivial presentational components.

### 4.3 E2E Tests

- **Framework:** Playwright.
- **Location:** `tests/e2e/`.
- **Running:** `npm run test:e2e` (requires dev server running).
- **Scope:** Critical user flows only (CRUD operations, board interactions, settings persistence).

### 4.4 What NOT to Do in Tests

- Do not change existing test assertions unless they are clearly testing wrong behavior.
- Do not test implementation details (private methods, internal state shape). Test observable behavior.
- Do not use `as any` to bypass type checking in tests. Create proper test fixtures.
- Do not make tests dependent on execution order.

---

## 5. Architecture Patterns

### 5.1 File Organization

```
capest-planner/
├── assets/styles/       # Global SCSS
├── components/          # Vue components (grouped by domain)
│   ├── board/          # Board-related components
│   ├── common/         # Shared UI components
│   ├── initiatives/    # Initiative-related
│   └── members/        # Member-related
├── composables/         # Vue composables (use* prefix)
├── layouts/             # Nuxt layouts
├── pages/               # Nuxt pages (auto-routed)
├── stores/              # Pinia stores
├── types/               # TypeScript type definitions
├── utils/               # Pure utility functions
└── tests/
    ├── unit/            # Vitest unit tests
    └── e2e/             # Playwright E2E tests
```

### 5.2 Data Flow

- **State management:** Pinia stores are the single source of truth.
- **Persistence:** Stores persist to `localStorage` with `capest-` prefix keys.
- **Component → Store:** Components call store actions. Never mutate store state directly.
- **Cross-component communication:** Through shared stores. Avoid prop drilling deeper than 2 levels.

### 5.3 Error Handling

- **All `JSON.parse()` calls must be wrapped in try/catch** with graceful fallbacks.
- **Store actions should return boolean/null** to indicate success/failure when applicable.
- **User-facing errors:** Use the toast/snackbar system (`useToast`). Never show raw error messages.
- **Console warnings** are acceptable for developer-facing issues (e.g., migration warnings).

---

## 6. Git Workflow

- **Branch naming:** `feature/STE-{number}-{short-description}`, `fix/STE-{number}-{description}`
- **Commit incrementally** with clear messages. One logical change per commit.
- **Do not commit** generated files, build artifacts, or `.deb` packages.
- **Pull latest** before starting work to avoid merge conflicts.

---

_This document is maintained by the engineering team. Propose changes via issues tagged with `process`._
