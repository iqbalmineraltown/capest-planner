# Capest Planner - Capacity Planning Application

A web application for planning team capacity on a quarterly basis.

## Overview

Capest Planner enables teams to:
- Manage team members with their roles, availability, and initiative assignments
- Define initiatives with required roles and estimated effort
- Visualize capacity allocation via a kanban-style board with columns per manweek
- Drag and drop to adjust capacity planning across quarters
- Identify bottlenecks and resource allocation issues

## Tech Stack

- **Framework**: Nuxt.js 3 with Vue.js 3 (Composition API)
- **State Management**: Pinia with localStorage persistence
- **UI Library**: Vuetify 3
- **Testing**: Vitest (unit), Playwright (E2E)

## Project Structure

```
capest-planner/
├── components/
│   ├── common/          # Shared components (AppHeader, AppDrawer, ConfirmDialog)
│   ├── members/         # Team member feature components
│   ├── initiatives/     # Initiative management components
│   └── board/           # Capacity planning board components
├── composables/         # Vue composables (localStorage, drag-drop, capacity calc)
├── stores/              # Pinia stores (members, initiatives, quarters, roles)
├── types/               # TypeScript interfaces
├── utils/               # Utility functions
├── pages/               # Nuxt pages
├── layouts/             # Nuxt layouts
├── tests/               # Unit and E2E tests
└── assets/              # Styles and static assets
```

## Data Models

### Team Member
- `id`: Unique identifier
- `name`: Member's full name
- `roles`: Array of role types (BE, FE, MOBILE, QA, or custom)
- `availability`: Available manweeks per quarter
- `assignedInitiatives`: Array of initiative IDs

### Initiative
- `id`: Unique identifier
- `name`: Initiative name
- `description`: Detailed description
- `quarter`: Quarter ID (e.g., "Q1-2025")
- `roleRequirements`: Array of {role, effort} requirements
- `assignments`: Array of member assignments with weeks and start week
- `carriesOverTo`: Next quarter ID if initiative spans beyond current

### Quarter Configuration
- `id`: Quarter ID (e.g., "Q1-2025")
- `label`: Display label
- `totalWeeks`: Typically 13 weeks
- `startDate` / `endDate`: Quarter date range

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## Key Features

### Role Color Coding
- BE (Backend): Blue
- FE (Frontend): Green
- MOBILE: Orange
- QA: Purple
- Custom roles get dynamically assigned colors

### Capacity Board
- Week-by-week visualization of assignments
- Color-coded assignment cells by role
- Carry-over indicators for initiatives spanning quarters
- Over-allocation warnings

### Persistence
All data is automatically persisted to localStorage with keys prefixed by `capest-`:
- `capest-members`
- `capest-initiatives`
- `capest-quarters`
- `capest-roles`

## Conventions

- Use Composition API with `<script setup lang="ts">`
- Import aliases: Use `~/` for project-relative paths
- Store pattern: Pinia stores with composition API setup functions
- Component naming: PascalCase for files and components
- Type safety: Strict TypeScript with proper typing

## Parallel Development

For complex or multi-file tasks, you are encouraged to spawn subagents or teammates to work in parallel. This can significantly speed up development for:
- Creating multiple components simultaneously
- Running independent tests
- Parallel feature development
- Code review and exploration tasks

Use the Task tool to spawn specialized agents when appropriate. Subagents/teammates can use the default sonnet model for their tasks.
