<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# VWMS Frontend Development Rules

## Core Philosophy

This project is a professional welfare/financial management system.
This project is mainly created for mobile users so make design,fetching of data, responsiveness accordingly. design should follow mobile first approach design for mobile should be clear and clean

The UI must feel:

- trustworthy
- structured
- calm
- low-noise
- enterprise-grade
- NGO/community-focused

Avoid startup-style flashy UI.

Never use:
- random color usage

Prefer:
- whitespace
- muted surfaces
- borders over shadows
- clean hierarchy
- consistent spacing

---

# Theme & Design System

## Theme Identity

The design system uses:

- emerald/teal primary colors
- slate neutral surfaces
- soft mint accents
- professional dark sidebar

The application theme is token-based using shadcn/ui CSS variables.

Always use semantic tokens.

Never hardcode colors directly inside components unless absolutely necessary.

---

# Radius & Styling Rules

Use:
- rounded-xl for cards
- rounded-lg for inputs/buttons

Global radius is already configured.

Do not create inconsistent radius values.

---

# Typography Rules

Use consistent hierarchy:

- Page Title
- Section Title
- Card Title
- Muted Label
- Body Text
- Table Text

Never freestyle font sizes repeatedly.

Prefer reusable typography patterns.

---

# Layout Rules

The app layout must remain consistent across all dashboard pages.

Always use:

- AppShell
- Sidebar
- Header
- Content Container

Pages should NOT create custom layouts independently.

---

# Component Architecture

## Component Priority Order

1. ui/
Primitive reusable shadcn components

2. shared/
Cross-feature reusable business components

3. feature components
Feature-specific UI

Never skip reusable abstraction if a pattern repeats.

---

# Feature-Based Structure

Use feature-first architecture.

Correct:
features/donations/
features/expenses/

Avoid scattering logic across unrelated folders.

---

# Page Rules

Pages must remain thin.

Pages should mainly:
- fetch route params
- compose components
- connect feature containers

Do NOT place:
- business logic
- validation logic
- API logic
- huge JSX trees

inside pages.

---

# API Rules

Never call fetch directly inside components/pages.

Always use:
services/
lib/api/

Pattern:
services/donations.service.ts
services/expenses.service.ts

Pages/components should not know API URLs.

---

# React Query Rules

All server state must use React Query.

Use:
- query keys
- invalidation
- optimistic updates where safe

Never manually duplicate server state unnecessarily.

---

# Forms

All forms must use:
- React Hook Form
- Zod
- shadcn form components

Create reusable form wrappers.

Examples:
- FormInput
- FormSelect
- FormTextarea
- FormCurrencyInput

Avoid duplicated form field markup.

---

# Tables

This app is table-heavy.

All tables must follow one reusable table architecture.

Use TanStack Table.

Features expected:
- pagination
- sorting
- filtering
- loading state
- empty state
- row actions

Financial amounts must always:
- align right
- use consistent formatting

---

# Financial UI Rules

Financial data is critical.

Always:
- align numbers right
- use tabular spacing
- highlight totals clearly
- differentiate statuses visually

Never use flashy styling for financial records.

---

# Status System

Status colors must remain globally consistent.

Approved:
- green/emerald

Pending:
- amber/warning

Rejected:
- red/destructive

Voided:
- muted/slate

Draft:
- neutral

Never invent random status colors.

---

# Permission System

Never hardcode role checks repeatedly.

Do NOT do:
if (role === "admin")

Instead use centralized permission utilities.

Example:
can(user, "expense.approve")

Permission logic must stay centralized.

---

# Accessibility Rules

Always ensure:
- keyboard accessibility
- visible focus states
- semantic HTML
- sufficient color contrast

Never remove focus outlines without replacement.

---

# Mobile Responsiveness

The application must remain usable on:
- mobile
- tablet
- desktop

Sidebar should collapse properly.

Tables should support overflow handling.

Forms should stack vertically on mobile.

---

# Loading & Empty States

Every async UI must support:
- loading state
- empty state
- error state

Never leave blank sections during loading.

---

# Data Integrity UI Rules

This system is audit-focused.

Approved records are immutable.

UI must clearly communicate:
- approved state
- voided state
- locked state
- pending approval state

Never allow misleading editing experiences.

---


# Code Quality Rules

Prefer:
- reusable abstractions
- composable components
- small focused files

Avoid:
- giant components
- duplicated logic
- inline business logic

---

# Styling Rules

Prefer utility classes with semantic tokens.

Avoid long unreadable class strings.

Extract reusable variants where possible.

---

# Animation Rules

Animations should be subtle and purposeful.

Allowed:
- fade
- slide
- hover transitions
- loading skeletons

Avoid:
- bouncing
- exaggerated motion
- distracting effects

---

# Dashboard Design Direction

Dashboard should feel:
- operational
- administrative
- informative

NOT marketing-oriented.

Use:
- stat cards
- charts
- activity lists
- approval queues
- summaries

Avoid giant hero sections.

---

# File Upload Rules

Receipts/documents must:
- show upload state
- show file preview if possible
- validate type/size
- handle upload errors gracefully

---

# Naming Conventions

Components:
PascalCase

Hooks:
useSomething

Services:
something.service.ts

Types:
something.types.ts

Constants:
UPPER_CASE

---

# Reusability Rule

If a UI pattern appears 2-3 times,
extract it into a reusable component.

---

# Final Principle

Consistency is more important than creativity.

The entire application should feel like:
one unified professional system.
<!-- END:nextjs-agent-rules -->
