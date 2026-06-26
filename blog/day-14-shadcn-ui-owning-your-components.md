# Day 14: shadcn/ui — Owning Your Components Instead of Fighting a Library

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #shadcn #react #components #ui

---

shadcn/ui isn't a component library. It's a component catalog that you copy into your project. That distinction changes everything.

## The Problem with Component Libraries

I've used Material UI, Chakra UI, Ant Design, and Mantine on past projects. They all share the same fundamental issue: you don't own the code.

Want to change how the Select component handles overflow? Submit a PR and wait. Need a Button variant that doesn't exist? Override 4 CSS classes and hope the next version doesn't break them. Have a design that doesn't quite match the library's opinion? Fight it with `!important` and wrappers.

Every component library is a set of opinions. When your design aligns with those opinions, it's magic. When it doesn't, it's a war.

## The shadcn Approach

With shadcn/ui, I ran:

```bash
npx shadcn@latest add button card badge select sheet tabs
```

This copied the component source code into `src/components/ui/`. I own it. It's in my repo. I can read it, modify it, and never worry about a version bump breaking my customizations.

The components are built on Radix UI primitives (accessible, keyboard-navigable, screen-reader friendly) and styled with Tailwind CSS. The source is clean and readable — most components are 30-80 lines.

## What I Customized

Out of 46 shadcn components in my project, I modified about 15:

**Button** — Added an `accent` variant for gold CTAs and sized down the `icon` variant for action buttons in tables:

```tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      // ... other variants
    },
  },
});
```

**Badge** — Added a `success` variant with green background for "paid" and "active" statuses:

```tsx
<Badge variant="success">paid</Badge>
<Badge variant="secondary">pending</Badge>
```

**Card** — Added `bg-card-soft` and `shadow-elegant` as default class options. Every Card in the app has consistent hover shadows without specifying it per-component.

**Sheet** — Used for the mobile sidebar. Customized the overlay opacity and the sheet width to match the sidebar design.

**Select** — Increased the dropdown max-height for lists with many options (like branch selection with 6 branches, role selection with 9 roles).

Each customization took 2-5 minutes. No library upgrade risk. No CSS specificity battles.

## The Components I Use Most

**Card + CardHeader + CardContent** — The most-used component. Dashboard KPIs, branch listings, plan editors, lead cards in the Kanban board, invoice tables, visitor forms. Everything is a Card.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Monthly revenue trend</CardTitle>
  </CardHeader>
  <CardContent className="h-72">
    <ResponsiveContainer>
      <LineChart data={monthly} />
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Badge** — Status indicators everywhere. Lead scores, plan types, invoice statuses, role labels, seat availability counts:

```tsx
<Badge>won</Badge>
<Badge variant="secondary">hot_desk</Badge>
<Badge className="bg-success">paid</Badge>
<Badge variant="outline">6 Branches</Badge>
```

**Select** — Role dropdowns, branch pickers, stage transitions, plan type selectors. Radix's Select primitive handles keyboard navigation, screen readers, and focus management. I just supply the options:

```tsx
<Select value={user.role} onValueChange={(v) => updateRole(v)}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    {roles.map((r) => (
      <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Sheet** — Mobile sidebar drawer. On desktop, the sidebar is always visible. On mobile, it slides in from the left as a Sheet:

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <nav>{/* sidebar links */}</nav>
  </SheetContent>
</Sheet>
```

One component. Handles overlay, animation, focus trapping, and Escape-to-close. All accessible by default.

## The `asChild` Pattern

Radix (which shadcn builds on) has an `asChild` prop that merges the component's behavior with its child element. This is incredibly useful:

```tsx
<Button asChild>
  <Link to="/pricing">See pricing</Link>
</Button>
```

The `<Link>` gets the Button's styling (classes, variant, size) but remains a `<Link>` element with proper routing behavior. No wrapper divs. No `onClick={() => navigate(...)}` hacks. Just composition.

I use this pattern everywhere:

```tsx
<Button asChild size="lg" className="bg-accent">
  <Link to="/book-visit">Book a site visit</Link>
</Button>

<Button asChild variant="outline">
  <a href={whatsappLink("Hi!")} target="_blank">WhatsApp</a>
</Button>
```

Buttons that are links. Buttons that are anchors. The visual is a button. The behavior is correct for each case.

## What I Didn't Use

46 components in the project. I actively use about 20. The rest (Accordion, Calendar, Carousel, Command, ContextMenu, Drawer, HoverCard, etc.) are installed but unused. shadcn components are tree-shaken — unused components don't appear in the bundle.

I didn't delete them because they cost nothing in the bundle and might be useful later. The Calendar component, for example, will be needed when I build the meeting room availability view.

## The Decision Framework

When should you use shadcn/ui vs. a traditional component library?

**Use shadcn when:**
- You have custom design requirements
- You want to understand what your components do
- You don't want to fight a library's opinions
- You value long-term ownership over short-term speed
- You're building a product, not a prototype

**Use a traditional library when:**
- You're building an internal tool where design consistency matters less than speed
- You have a design system that matches the library (e.g., Material Design → MUI)
- You don't have time or desire to customize components
- You're prototyping and will rebuild later

For a production SaaS that needs to look polished and behave exactly how I want? shadcn. Every time.

---

**Tomorrow:** Day 15 — The Member Dashboard: Building a Portal That Members Actually Use

**Image suggestions:**
- SCREENSHOT: The Badge component in various states (success, secondary, outline, accent)
- SCREENSHOT: The mobile sidebar Sheet in action
- SCREENSHOT: A Select dropdown with role options
- CODE SCREENSHOT: The asChild pattern with Button + Link

**LinkedIn post:**

> shadcn/ui isn't a component library. It's a component catalog you own.
>
> The difference matters:
>
> Component library: Submit a PR to change Select overflow behavior
> shadcn: Edit the file in your repo. Done.
>
> I have 46 shadcn components. Modified 15 of them. Each took 2-5 minutes.
>
> - Added "accent" Button variant for gold CTAs
> - Added "success" Badge variant for paid/active states
> - Customized Sheet width for mobile sidebar
> - Increased Select dropdown max-height
>
> Zero version conflicts. Zero CSS specificity wars. Zero `!important`.
>
> The best part: the `asChild` pattern from Radix:
>
> ```
> <Button asChild>
>   <Link to="/pricing">See pricing</Link>
> </Button>
> ```
>
> A button that's actually a router link. Correct styling AND correct navigation. No wrapper divs.
>
> For a production SaaS: own your components.
>
> Day 14 of 45: [link]

**X post:**

> shadcn/ui: copy components into your project. Own the code.
>
> Modified 15 of 46 components. Each took 2-5 minutes.
>
> Zero npm version conflicts. Zero CSS battles. Zero !important.
>
> The asChild pattern alone is worth it:
> <Button asChild><Link to="/x">Go</Link></Button>
>
> Day 14/45
