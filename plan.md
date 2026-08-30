# Careers Tracker - Master Build Prompt

## 1. Project overview

Build a polished, private, single-user careers opportunity tracker.

The application is designed to manage approximately 100 companies and potentially hundreds of opportunities across:

* Degree apprenticeships
* Internships
* Work experience
* Insight days
* STEM outreach
* Custom opportunity types

The application should feel like a premium modern productivity/database application rather than a traditional admin dashboard.

The visual direction is:

* **Attio** for table design and data density
* **Ramp** for overall UI polish, buttons, navigation and application structure
* **Raycast** for speed, responsiveness and performance philosophy
* **Notion** for inline editing and moderate spacing
* A custom **white + pale green** visual identity using `#A3B18A` as the primary accent
* A pill-style top navigation inspired by modern applications such as Consensys
* Hybrid design: professional SaaS + developer productivity + personal command centre

Do not copy any of these products directly. Use them only as design references.

The application must work extremely well on:

* Desktop
* Laptop
* iPad
* iPhone

It is primarily a personal application and should remain private to the authenticated user.

---

# 2. Technology stack

Use:

* Vite
* React
* TypeScript
* Latest stable Node.js version available at implementation time
* Tailwind CSS v4
* shadcn/ui
* Convex for all application data/storage
* WorkOS for authentication
* TanStack Table for data tables
* Lucide icons
* Modern React best practices

Use the latest stable versions of dependencies where compatible.

Do not introduce unnecessary dependencies.

Before adding a third-party library for a feature, assess whether the existing stack can handle it cleanly.

---

# 3. Core design philosophy

The application should feel extremely fast.

The user should never feel like they are waiting for a database request to complete when performing local operations.

If data has already been loaded, changing:

* Views
* Filters
* Sorting
* Search
* Column visibility
* Ranking
* Saved views
* Table configuration

must happen locally and essentially instantly.

Do not unnecessarily refetch unchanged data when changing local views.

Convex should provide the reactive source of truth, while already-loaded data should be reused for local transformations.

Use optimistic UI wherever appropriate.

For example:

* Inline edits should update immediately
* Checkbox changes should update immediately
* Status changes should update immediately
* Kanban movements should update immediately
* Bulk operations should provide immediate UI feedback
* Creating items should feel instantaneous

Where data genuinely needs to load asynchronously, use polished skeleton states rather than generic "Loading..." text.

Use appropriate React optimisation techniques so changing one piece of data does not unnecessarily rerender the entire application.

With approximately 100 companies, normal client-side filtering/sorting should be extremely fast.

Design the architecture so it can scale to substantially more opportunities and applications without requiring a complete rewrite.

---

# 4. Authentication and privacy

Use WorkOS authentication.

The application is private to the authenticated user.

There is currently no requirement for:

* Sharing
* Teams
* Collaboration
* Public profiles
* Multi-user workspaces

All Convex records must be associated with the authenticated user.

Users must only be able to access their own data.

However, structure the schema cleanly enough that multi-user support could theoretically be introduced later.

Do not build unnecessary collaboration functionality.

---

# 5. Main navigation

Use a **top navigation bar**, not a permanent sidebar.

The navigation should use a polished pill-style design.

Primary destinations:

* Dashboard
* Companies
* Opportunities
* Applications
* Deadlines
* Contacts

The active navigation item should have a subtle highlighted background.

Avoid oversized navigation elements.

The navbar should remain compact and elegant.

Do not permanently place a large global "+ Add" button inside the navbar.

The global add functionality should instead appear contextually at the top of relevant pages/tables.

For example:

Companies:

`+ Add Company`

Opportunities:

`+ Add Opportunity`

Applications:

`+ Add Application`

Contacts:

`+ Add Contact`

On mobile, use a compact top bar with a hamburger menu.

Do not use bottom navigation.

---

# 6. Visual identity

Primary accent:

`#A3B18A`

Use this as the foundation for the pale green visual identity.

Do not make every component green.

Use the colour carefully for:

* Primary actions
* Selected states
* Active navigation
* Focus states
* Important highlights
* Relevant accents

The application should predominantly remain white/light neutral in light mode.

Dark mode should not simply invert the light theme.

Dark mode should use:

* Very dark neutral background
* Slightly lighter surfaces
* Subtle borders
* Pale green accents
* Appropriate contrast

The application must support light and dark themes.

Theme selection belongs in **Settings**, not the navbar.

---

# 7. Configurable colour schemes

The application should support configurable visual themes.

Initially provide multiple built-in colour schemes so the user can experiment.

At minimum include:

* Pale Green - primary `#A3B18A`
* A neutral/monochrome theme
* A purple/indigo theme
* A warm/orange theme
* A blue theme

The user should be able to preview themes inside Settings before applying them.

The theme preview should demonstrate:

* Buttons
* Navbar
* Status pills
* Table selections
* Filters
* Inputs
* Cards
* Links

Changing the theme should update the entire application consistently.

Do not hard-code colours throughout components.

Use semantic design tokens/CSS variables so themes can be changed centrally.

The selected theme should also influence the visual treatment/order of filters and colour-coded table elements where appropriate.

---

# 8. Typography and spacing

Use a clean modern sans-serif typeface.

Prioritise readability and information density.

Spacing should be:

* More compact than typical dashboard applications
* Similar to Notion/Attio
* Never cramped
* Never excessively spacious

Use moderate border radius, approximately 6-8px for most components.

Do not use excessive rounded cards.

Reserve pill shapes primarily for:

* Statuses
* Tags
* Navigation
* Compact filters

Tables should be fairly dense but still comfortable to use.

Desktop should use a relatively compact table density.

iPad can use slightly more comfortable spacing.

Mobile should switch to a mobile-appropriate layout.

---

# 9. Data model

Use the following conceptual structure:

```text
User
 ├── Companies
 │    ├── Opportunities
 │    ├── Applications
 │    └── Contacts
 │
 ├── Custom Opportunity Types
 ├── Custom Statuses
 ├── Custom Ratings
 ├── Saved Views
 └── Trash
```

Do not create separate database tables for degree apprenticeships, internships, work experience, etc.

Use one Opportunity model with an opportunity type.

---

# 10. Companies

A company can exist without any opportunities.

A company should contain at least:

* ID
* User ID
* Name
* Website URL
* Favicon/logo
* Notes
* Overall score
* Created date
* Updated date
* Custom rating values
* Archived/trash state

Companies can have:

* Multiple opportunities
* Multiple applications
* Multiple contacts
* Multiple locations indirectly through opportunities

A company should not require an opportunity to exist.

---

# 11. Company table

The Companies page should primarily be a clean, dense table inspired by Attio.

The default columns should include:

* Selection checkbox
* Company
* Opportunities/types
* Contacts
* Score
* Relevant application/status information where useful

Company column:

```text
[icon] Company name
```

The company icon should be small but clearly visible.

Do not use huge logos.

The favicon/logo should appear to the left of the company name.

---

# 12. Company opportunity indicators

The company table should make it immediately obvious what a company offers.

For example:

```text
Cisco       🎓  💼  🔬  🏢
```

Use Lucide icons rather than relying on emoji.

Example icons:

* Degree apprenticeship - GraduationCap
* Internship - Briefcase
* Work experience - Building
* Insight day - Lightbulb
* STEM outreach - FlaskConical

Custom opportunity types should be able to choose an icon.

Each opportunity type indicator should be interactive.

Where appropriate, show a small pop-out/arrow action beside an opportunity type.

Clicking it should open the relevant opportunity/link.

Do not make the table unnecessarily wide.

If there are many opportunities, use a compact count/indicator and open a Sheet for details.

---

# 13. Contacts in company table

The company table should have a compact people/contact indicator.

For example:

```text
👥 3
```

or a small people icon with a count.

Clicking it should open a Sheet containing the company's contacts.

Contacts are intentionally simple.

Each contact contains:

* Name
* LinkedIn URL
* Company ID

Do not build a full CRM.

Do not add:

* Contact timelines
* Contact history
* Relationship scoring
* Follow-up reminders
* Complex CRM functionality

---

# 14. Company Sheet

Clicking a company should open a shadcn Sheet.

Desktop:

* Right-side Sheet
* Approximately 450-550px wide

Mobile:

* Full-screen Sheet/page-like presentation

The company Sheet should include:

## Header

* Company logo
* Company name
* Website
* Overall score
* Close button

## Opportunity types

Show what the company offers.

## Opportunities

Show all opportunities belonging to the company.

Each opportunity should display:

* Name
* Type
* Location
* Deadline
* Status
* Relevant link

## Contacts

Show contacts with:

* Name
* LinkedIn link

## Ratings

Show the company's configurable rating criteria.

## Notes

Show/edit company notes.

Everything should support inline editing where practical.

---

# 15. Opportunities

Opportunities are first-class database objects.

Each opportunity should support:

* ID
* User ID
* Company ID
* Name
* Opportunity type
* Locations[]
* Links[]
* Deadlines[]
* Status
* Notes
* Custom rating values
* Open/closed state
* Created date
* Updated date
* Trash state

Examples:

* Technology Degree Apprenticeship
* Cyber Security Internship
* STEM Insight Day
* Work Experience Programme

---

# 16. Opportunity types

Built-in types:

* Degree Apprenticeship
* Internship
* Work Experience
* Insight Day
* STEM Outreach

Users can create custom opportunity types.

A custom type should support:

* Name
* Icon
* Colour
* Sort/order position

The user should be able to edit/delete custom types where safe.

Built-in types should not be accidentally deleted.

---

# 17. Multiple locations

Every opportunity can have multiple locations.

Examples:

```text
London
Manchester
Glasgow
```

Do not assume an opportunity only has one location.

Location selection should be easy and clean.

Support:

* City
* Country
* Optional remote/hybrid/on-site information

The UI should not become cumbersome when adding multiple locations.

---

# 18. Multiple deadlines

Every individual opportunity must support multiple deadlines.

This is important because programmes can have:

* Opening dates
* Application deadlines
* Assessment deadlines
* Interview deadlines
* Rolling deadlines
* Other custom deadlines
* Recurring/repeating deadlines

Do not store only one deadline field.

A deadline should be its own object containing:

* Name/type
* Date
* Optional time
* Optional recurring/repeating information
* Notes

Use shadcn calendar/date-picker components for date selection.

The date selector should look polished and consistent with the rest of the application.

---

# 19. Deadline view

Create a dedicated **Deadlines** page.

Display deadlines chronologically.

Each deadline should clearly show:

* Company
* Opportunity
* Deadline name
* Date
* Countdown

Example:

```text
Cisco
Cyber Security Internship

Application deadline
12 September 2026

16 days remaining
```

Use colour coding:

* Urgent
* Soon
* Upcoming
* Passed

The exact thresholds should be sensible and configurable if appropriate.

Do not rely solely on colour. Include text/countdowns.

Past deadlines should remain accessible.

---

# 20. Links

Opportunities should support multiple individual links.

For example:

```text
Application
Programme information
Requirements
LinkedIn
Other
```

Each link contains:

* Name
* URL
* Optional type

Links should be displayed compactly.

Use external-link icons.

The user should be able to add, edit and remove links inline.

---

# 21. Applications

Applications should be separate first-class objects.

An application can attach to:

* A company
* Optionally an opportunity

This allows multiple applications to the same company.

Example:

```text
Company: Cisco
Application 1: Cyber Security Internship
Application 2: Technology Degree Apprenticeship
```

An application should contain:

* Company ID
* Optional opportunity ID
* Status
* Notes
* Deadlines where application-specific
* Links where useful
* Created/updated dates
* Custom fields

Do not assume one company can only have one application.

---

# 22. Application statuses

Provide sensible built-in statuses such as:

* Not Started
* Interested
* Preparing
* Applied
* Assessment
* Interview
* Offer
* Rejected
* Withdrawn

Users must be able to create their own custom statuses.

Each status supports:

* Name
* Colour
* Ordering

The UI should show statuses as small coloured pills.

Example:

`Applied`

with a subtle colour background.

Do not use huge coloured buttons for statuses.

---

# 23. Application Kanban

Applications should support a Kanban view.

Columns represent application statuses.

For example:

```text
Interested
Preparing
Applied
Assessment
Interview
Offer
```

Cards should be compact.

A card might display:

```text
Cisco

Cyber Security Internship

Deadline
12 Sep

Applied
```

Cards must be draggable between statuses.

Moving a card should update the status optimistically.

The Kanban should remain usable on desktop and tablet.

---

# 24. Custom ratings and scoring

The scoring system must be highly configurable.

Users can create custom rating criteria.

Examples:

* Career prospects
* Cybersecurity relevance
* Degree quality
* Salary
* Company reputation
* Progression
* Location
* Personal interest
* CV value
* Learning value

A rating should support:

* Name
* Description
* Score range
* Weight
* Applicable entity type
* Ordering

Default score range should be 0-100.

Users should be able to create custom ratings.

---

# 25. Weighted scoring

Overall scores should be calculated automatically from weighted ratings.

Conceptually:

```text
Overall Score =
Σ(rating score × rating weight)
```

Weights should be normalised appropriately.

Example:

```text
Career prospects       20%
Cyber relevance        20%
Degree quality         15%
Salary                 10%
Reputation             10%
Progression            10%
Location               10%
Personal interest       5%
```

The resulting overall score should be displayed clearly.

Users should not need to manually calculate the overall score.

---

# 26. Company and opportunity scoring are independent

A company score and opportunity score are not necessarily the same.

For example:

A company can score 95 overall while one internship scores only 70.

Support separate rating configurations for different entity types.

This allows the user to rank:

* Companies
* Degree apprenticeships
* Internships
* Other opportunities

independently.

---

# 27. Ranking

Allow tables to sort by overall score.

Display ranking where useful:

```text
#1 JPMorganChase       96
#2 Cisco               94
#3 Thales              91
```

Ranking should automatically update when scores change.

Do not persist a manually calculated rank unless necessary.

Calculate it from the relevant sorted dataset.

---

# 28. Table views

Create views rather than creating separate database collections.

Default views should include:

* All Companies
* Degree Apprenticeships
* Internships
* Work Experience
* Insight Days
* STEM Outreach
* All Opportunities
* Applications
* Deadlines
* Contacts

These should primarily be filters over the same underlying data.

---

# 29. Saved views

Allow the user to create saved views.

A saved view should store things such as:

* Filters
* Sorting
* Visible columns
* Grouping if supported
* Table configuration

Example:

**Top UK Cyber Apprenticeships**

Filters:

* Opportunity type = Degree Apprenticeship
* Location = UK
* Cyber relevance > 70
* Application status ≠ Rejected

Sort:

* Score descending

Views should load instantly from already-loaded data.

---

# 30. Filtering

Use TanStack Table's filtering capabilities.

Support:

* Global search
* Column filtering
* Faceted filtering
* Multiple filters
* Sorting
* Numeric filters
* Date filters
* Status filters
* Type filters
* Location filters
* Score filters

Example:

```text
Type:
✓ Degree Apprenticeship
✓ Internship

Location:
✓ London

Score:
80-100

Status:
✓ Open
✓ Applied
```

Filters should be visually clean and compact.

Do not create a giant filter sidebar that permanently consumes screen space.

Use a filter button/popover/sheet depending on screen size.

---

# 31. Column visibility

Users should be able to choose which table columns are visible.

Example:

```text
Columns

✓ Company
✓ Opportunities
✓ Score
✓ Status
✓ Deadline
✓ Contacts
□ Notes
□ Website
□ Location
```

This is important because there can be a large amount of data.

Changing column visibility must be instant and local.

---

# 32. Inline editing

Inline editing should feel similar to Notion.

Do not force users into a separate edit page.

Examples:

Company name:

```text
Cisco
```

Click:

```text
[ Cisco____________ ]
```

Press Enter to save.

Status:

```text
Applied
```

Click to open a compact select.

Score:

```text
94
```

Click and edit.

Checkbox:

```text
✓
```

Click to toggle.

Use optimistic updates.

Avoid unnecessary confirmation dialogs for harmless edits.

---

# 33. Sheets and drawers

Use shadcn Sheet components extensively.

Sheets should be used for secondary/detail information rather than navigating away from the main table.

Examples:

* Company details
* Opportunity details
* Contacts
* Rating configuration
* Import preview
* Filter configuration
* Custom field configuration

On mobile, Sheets may become full-screen.

---

# 34. Dashboard

The Dashboard should be the landing page.

Use the user's name where available.

Example:

```text
Good afternoon, Freddie

Your careers tracker
```

Use horizontal space effectively.

Avoid a narrow centred dashboard.

Desktop should use the full available content width.

Show useful summary information:

* Companies
* Opportunities
* Applications
* Active applications
* Interviews
* Offers

Then show:

## Upcoming deadlines

A compact list.

## Top companies

Ranked by score.

## Application pipeline

A compact overview of application statuses.

The dashboard should be useful, not decorative.

Do not fill it with unnecessary charts.

---

# 35. Dashboard add functionality

The dashboard should have an obvious contextual add action.

For example:

```text
+ Add
```

with options:

* Company
* Opportunity
* Application
* Contact

Other pages should have contextual add buttons at the top of their tables.

Do not keep a global add button permanently fixed in the navbar.

---

# 36. Mobile design

Mobile should not simply shrink desktop tables.

Use responsive layouts.

On desktop:

* Dense Attio-style tables

On iPad:

* Table remains available
* Comfortable touch targets
* Sheets work well
* Fewer default columns where appropriate

On iPhone:

* Use compact cards/rows where necessary
* Show the most important information
* Open detailed records using full-screen Sheets

Mobile navigation:

* Compact top bar
* Hamburger menu
* No bottom navigation

---

# 37. Table mobile representation

A mobile company item might look like:

```text
[logo] Cisco                         94

🎓 Degree Apprenticeship
💼 Internship

👥 3 contacts

3 opportunities
```

Do not attempt to display 15 columns horizontally on a phone.

Provide a clear route to the full record.

---

# 38. Favicon/logo handling

When adding a company, the user supplies a website URL.

Automatically attempt to find the company's favicon using standard favicon locations.

Prioritise standard favicon mechanisms.

Do not scrape the company website for general information.

Do not build company enrichment.

If no favicon can be found:

Prompt the user to upload a logo manually.

Allow manual upload at any time.

The manually uploaded logo should override the automatically detected favicon.

Cache retrieved favicon assets where appropriate so they are not repeatedly downloaded.

---

# 39. Notes

Companies and opportunities should support notes.

Notes should be simple and useful.

Do not build a full document editor.

A clean multiline text editor is sufficient initially.

Notes should support inline editing where practical.

---

# 40. Bulk operations

Bulk operations are important.

Tables must support row selection.

When rows are selected, show a bulk action toolbar.

Possible operations:

* Change status
* Change opportunity type
* Change location
* Change score/rating
* Delete
* Export selected
* Other safe bulk edits

The toolbar should appear contextually rather than permanently consuming space.

Bulk changes should provide optimistic feedback where possible.

---

# 41. Trash system

Deleting data should move it into Trash rather than immediately destroying it.

Trash should be accessible from Settings or an appropriate secondary location.

Display:

```text
Trash

Deleted items are permanently removed after 7 days.
```

Allow:

* Restore
* Delete permanently
* Empty trash

Automatically permanently delete items after seven days.

Be careful with relationships.

Restoring a company should not unexpectedly lose its associated opportunities, applications or contacts.

---

# 42. CSV import/export

Support CSV import and export.

Export should support:

* Companies
* Opportunities
* Applications
* Contacts
* Selected rows
* Filtered views
* Complete dataset

CSV should be predictable and AI-friendly.

Handle relationships carefully.

For example, applications should reference companies using stable IDs or clearly documented identifiers.

---

# 43. JSON import/export

Support full JSON import/export.

JSON should preserve:

* Companies
* Opportunities
* Applications
* Contacts
* Ratings
* Statuses
* Types
* Deadlines
* Locations
* Links
* Notes
* Saved views where appropriate

Use stable IDs and explicit relationships.

JSON should be deterministic and easy for AI systems to understand.

---

# 44. AI Data Format Guide

The application must include a built-in documentation page or downloadable guide explaining the CSV/JSON format.

This guide should be designed specifically so the user can give it to an AI such as ChatGPT or Claude.

It must explain:

* Entity structure
* Required fields
* Optional fields
* Company relationships
* Opportunity relationships
* Application relationships
* Contact structure
* Status values
* Custom statuses
* Opportunity types
* Custom opportunity types
* Rating structure
* Weighted scoring
* Deadline structure
* Location structure
* Link structure
* Valid enum values
* ID requirements
* Import behaviour
* How to modify existing records
* How to create new records

Include concrete examples.

The guide should effectively function as an API/schema specification for AI-generated tracker data.

The application itself does not need built-in AI functionality.

The intended workflow is:

```text
Export tracker
      ↓
Give CSV/JSON + AI Data Guide to AI
      ↓
AI analyses/modifies data
      ↓
AI returns valid CSV/JSON
      ↓
Import into tracker
```

---

# 45. Import workflow

Never blindly import data.

Use:

```text
Select file
      ↓
Parse
      ↓
Validate
      ↓
Preview changes
      ↓
Confirm
      ↓
Import
```

The preview should show:

* New records
* Updated records
* Unchanged records
* Errors
* Invalid values
* Missing relationships

Do not partially corrupt the database if an import contains errors.

Provide useful validation messages.

---

# 46. Search

Provide search directly within relevant table views.

A global command palette is **not required**.

Do not implement keyboard search/command palette unless it becomes useful later.

The primary search experience should be integrated into the table UI.

---

# 47. Loading states

Use skeletons whenever data is genuinely loading.

Skeletons should resemble the actual interface.

For example, company table loading should show:

```text
████████   ███████████   ███   ███████
████████   █████████     ███   ███████
████████   ███████████   ███   ███████
```

Do not show generic loading spinners for entire pages when a skeleton is possible.

Previously loaded data should remain visible while reactive updates are occurring whenever practical.

---

# 48. Performance requirements

Performance is a core feature.

Requirements:

* Minimise unnecessary Convex queries
* Reuse already-loaded data
* Perform view transformations locally
* Perform filtering locally where the dataset is already loaded
* Perform sorting locally where possible
* Cache favicon assets
* Optimistically update edits
* Avoid unnecessary React rerenders
* Keep table interactions responsive
* Debounce expensive search/filter operations if necessary
* Use skeletons for initial loading
* Do not reload entire datasets after individual edits
* Do not recreate expensive table structures unnecessarily

Switching between:

```text
All Companies
→ Degree Apprenticeships
→ Internships
→ Top Companies
```

should feel essentially instantaneous after the initial data has loaded.

The application should feel closer to a local desktop application than a slow web dashboard.

---

# 49. Accessibility

Use semantic HTML.

Ensure:

* Keyboard navigation
* Visible focus states
* Appropriate ARIA labels
* Accessible dialogs/sheets
* Accessible dropdowns
* Accessible colour contrast
* Do not rely exclusively on colour
* Touch targets are appropriate on mobile

Do not sacrifice accessibility for visual minimalism.

---

# 50. Error handling

Errors should be concise and useful.

Examples:

* Favicon unavailable
* Invalid URL
* Import validation error
* Failed save
* Authentication issue
* Invalid CSV
* Invalid JSON

Use toast notifications where appropriate.

Do not display technical stack traces to the user.

---

# 51. Empty states

Empty states should explain what the user can do.

Example:

```text
No companies yet

Start building your careers tracker by adding your first company.

+ Add Company
```

For a company with no opportunities:

```text
No opportunities

This company can still be tracked without any current opportunities.

+ Add Opportunity
```

Do not treat companies without opportunities as invalid.

---

# 52. Settings

Settings should contain:

* Appearance
* Theme selection
* Colour scheme previews
* Custom opportunity types
* Custom statuses
* Custom ratings
* Import/export
* AI Data Format Guide
* Trash
* Account/authentication

Theme previews should be visual rather than just dropdown text.

For example:

```text
Appearance

Light
[preview]

Dark
[preview]

System
[preview]

Colour scheme

Pale Green
[preview]

Indigo
[preview]

Monochrome
[preview]

Warm
[preview]
```

---

# 53. Data integrity

Use stable IDs for all entities.

Relationships should be explicit.

Do not use company names as primary relationship identifiers.

Renaming a company must not break:

* Opportunities
* Applications
* Contacts
* Links
* Ratings
* Saved views

CSV/JSON imports should respect stable IDs.

Where imported records do not have IDs, provide a predictable strategy for creating them.

---

# 54. Component architecture

Build reusable components rather than putting large amounts of UI logic inside pages.

Suggested component categories:

```text
components/
  layout/
  navigation/
  tables/
  companies/
  opportunities/
  applications/
  contacts/
  deadlines/
  ratings/
  filters/
  sheets/
  forms/
  import-export/
  settings/
  dashboard/
  ui/
```

Use shadcn components wherever they provide the appropriate primitive.

Important reusable components include:

* DataTable
* TableToolbar
* FilterPopover
* ColumnVisibility
* StatusBadge
* OpportunityTypeBadge
* CompanyAvatar
* CompanySheet
* OpportunitySheet
* ContactSheet
* RatingEditor
* DeadlinePicker
* DeadlineList
* ApplicationKanban
* ImportPreview
* TrashView
* EmptyState
* LoadingSkeleton

---

# 55. Table implementation

Use TanStack Table.

Support:

* Sorting
* Filtering
* Global search
* Column visibility
* Row selection
* Faceting
* Pagination if needed
* Editable cells
* Custom cell renderers

Do not use a giant third-party table component that fights with shadcn.

Build the presentation layer with shadcn/Tailwind while using TanStack Table for table state and logic.

---

# 56. Design details

The application should generally follow these visual rules:

* Small company icons
* Compact but readable table rows
* Moderate spacing
* Subtle borders
* White/light neutral surfaces
* Pale green accent
* Restrained shadows
* Small status pills
* Lucide icons
* Clean typography
* Minimal visual noise
* No oversized cards
* No excessive gradients
* No excessive glassmorphism
* No unnecessary animations

The interface should feel premium because of spacing, typography, hierarchy and interaction quality rather than decoration.

---

# 57. Interaction quality

Interactions should feel immediate.

Examples:

Clicking:

```text
🎓 3
```

opens the opportunity Sheet.

Clicking:

```text
👥 3
```

opens the contacts Sheet.

Clicking a score allows inline editing.

Clicking a status opens its selector.

Clicking a deadline opens the date/deadline editor.

Clicking an external-link icon opens the relevant opportunity/application URL.

Use subtle transitions.

Avoid excessive motion.

---

# 58. Security

Do not expose another user's Convex data.

Validate authentication server-side.

Do not rely solely on client-side filtering for access control.

All mutations must verify that the authenticated user owns the affected record.

Validate URLs and imported data.

Treat imported files as untrusted input.

---

# 59. Initial implementation order

Build in phases while maintaining a working application.

### Phase 1

* Vite setup
* Tailwind v4
* shadcn
* WorkOS
* Convex
* Base layout
* Theme system
* Top navbar

### Phase 2

* Company schema
* Company table
* Inline editing
* Favicon retrieval
* Manual logo upload
* Company Sheet

### Phase 3

* Opportunity schema
* Opportunity types
* Multiple locations
* Multiple links
* Multiple deadlines
* Opportunity Sheet

### Phase 4

* Applications
* Application statuses
* Custom statuses
* Kanban

### Phase 5

* Contacts
* Contact Sheets

### Phase 6

* Ratings
* Weighted scoring
* Ranking
* Custom ratings

### Phase 7

* Filtering
* Saved views
* Column visibility
* Bulk operations

### Phase 8

* Dashboard
* Deadline dashboard
* Countdown functionality

### Phase 9

* CSV import/export
* JSON import/export
* AI Data Format Guide
* Import validation/preview

### Phase 10

* Trash
* Settings
* Theme previews
* Responsive/mobile polish
* Performance optimisation
* Accessibility
* Final visual refinement

---

# 60. Important implementation principles

Do not over-engineer.

Do not add features that have not been requested.

Prefer simple, composable architecture.

Keep the UI fast.

Keep tables compact.

Keep detailed information in Sheets.

Keep the database relational.

Keep views client-side when the required data is already loaded.

Keep authentication private.

Keep the visual design consistent.

The finished product should feel like:

**Attio's data experience + Ramp's UI polish + Raycast's speed + Notion's inline editing, with a pale-green personal identity.**

The most important success criterion is that the user can manage around 100 companies and a large number of opportunities without the application ever feeling like a cumbersome spreadsheet.
