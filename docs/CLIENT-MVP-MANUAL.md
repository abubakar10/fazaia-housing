# FAZIA Housing ERP — Client MVP Manual

**What this document is:** A simple guide to the system as built today (Modules 0–7).  
**Who it is for:** Client stakeholders reviewing the MVP demo.  
**What it is not:** Full construction / billing / store software yet — those come in later modules.

---

## 1. What you are looking at (in plain words)

FAZIA Housing is an ERP for managing large housing projects.

This MVP already lets you:

1. Sign in securely  
2. Manage users and roles (who can do what)  
3. Set up your organization tree (HQ → Region → Site, etc.)  
4. Create projects and assign members  
5. Break a project into **Phases → Sectors → Blocks**  
6. Define **house types** and **templates**  
7. Register **houses**, import them from CSV, and open a house detail page  

Think of it as the **foundation of the project**: organization, projects, structure, and the house register.

---

## 2. How the system is organized (7 modules)

| Module | Name | What it does for you |
|---|---|---|
| **0** | Foundation | The app shell, menus, and technical base |
| **1** | Authentication | Login, logout, forgot password |
| **2** | User Management | Create and manage staff accounts |
| **3** | Roles & Permissions | Control what each role can see and do |
| **4** | Organization | Your official org hierarchy |
| **5** | Projects | Housing projects, members, settings, dashboard |
| **6** | Project Structure | Phases, sectors, and blocks under each project |
| **7** | Houses | House types, templates, house register, import, house detail |

**Coming later (not in this demo):** Contractors, full BOQ execution, site activities, inspections, store/materials, RAR, payment vouchers, reports inbox, etc.  
In the menu, **Store / Billing / Reports / Inbox / Admin** are visible but **disabled** on purpose.

---

## 3. How to open and sign in

1. Open the application URL (example for local demo: `http://localhost:3000`).  
2. You will see **Sign in to FAZIA Housing**.  
3. Enter **Email** and **Password**.  
4. Click **Sign in**.

If you forget the password, use **Forgot password?** (email reset flow).

**Demo tip:** Use the Super Admin account prepared for the demonstration (your team will share the email/password). Super Admin can open every screen in this MVP.

---

## 4. Main menu (left / navigation)

| Menu item | What you use it for | Available now? |
|---|---|---|
| **Overview** | Home / landing after login | Yes |
| **Users** | Staff accounts | Yes |
| **Roles** | Roles and permissions | Yes |
| **Organization** | Org units tree | Yes |
| **Projects** | All housing projects | Yes |
| **House types** | Types & templates catalog | Yes |
| Store / Billing / Reports / Inbox / Admin | Future modules | No (disabled) |

---

## 5. Suggested client demo walkthrough (15–20 minutes)

Follow this order — it matches how real data should be created.

```
Sign in
  → Organization (optional)
  → Projects → Create project
  → Project → Structure (Phase → Sector → Block)
  → House types (create type + template)
  → Project → Houses (create or import houses)
  → Open one house (detail page)
  → Project → Dashboard (see counts)
```

---

## 6. Module-by-module: what was made & how to use it

### Module 1 — Sign in

**Made:** Secure login session, logout, password reset pages.

**How to use:**
- Sign in with email/password  
- Use the account menu to sign out when finished  

---

### Module 2 — Users

**Made:** User directory for staff accounts.

**How to use:**
1. Open **Users**  
2. Invite / create users as your admin process allows  
3. Activate or deactivate accounts when people join or leave  

*(Exact buttons depend on your role permissions.)*

---

### Module 3 — Roles & Permissions

**Made:** Role-based access control. Screens and actions respect permissions.

**How to use:**
1. Open **Roles**  
2. Review system roles (examples: Super Admin, Resident Engineer, Finance, Store Officer, …)  
3. Assign roles to users so each person only sees what they need  

**Client note:** Even if a button is hidden for one role, Super Admin can demonstrate the full flow.

---

### Module 4 — Organization

**Made:** Hierarchical organization units.

**How to use:**
1. Open **Organization**  
2. Switch **Tree** or **Table** view  
3. Click **Add unit**  
4. Fill: **Code**, **Name**, **Type**, **Status**, **Parent**  
5. Save  

**Types available:** HQ, Region, Division, Site, Office, Store, Finance, Other  

You can open a unit to edit it and assign users to that unit.

---

### Module 5 — Projects

**Made:** Project list, project detail with five tabs, members, settings, dashboard summary.

#### A. Create a project
1. Open **Projects**  
2. Click **Create project**  
3. Fill the required details and save  
4. Open the project from the list  

#### B. Project tabs (important)

Inside a project you will see:

| Tab | Purpose |
|---|---|
| **Dashboard** | Snapshot of the project (counts, members, activity) |
| **Structure** | Phases / sectors / blocks |
| **Houses** | House register for this project |
| **Members** | Who can work on this project |
| **Settings** | Project name, status, manager, location, etc. |

#### C. Members
1. Open **Members**  
2. **Add member**  
3. **Remove** when needed  

#### D. Settings
You can update fields such as: **Name**, **Status**, **Project type**, **Priority**, **Client / owner**, **Consultant**, **Main contractor**, **Fiscal year**, **Organization unit**, **Project manager**, **Description**, **Location**, **Currency**, **Timezone**, GPS, logo URL, internal notes.

#### E. Archive
Use **Archive** if a project should become read-only. Use **Restore** to bring it back.

---

### Module 6 — Project Structure (Phases, Sectors, Blocks)

**Made:** Nested structure under each project.

**Hierarchy (always remember this):**

```
Project
  └── Phase
        └── Sector
              └── Block
                    └── Houses (Module 7 live here)
```

**How to use:**
1. Open a project → **Structure** tab  
2. Select where you want to add the next level  
   - On the project → create a **Phase**  
   - On a phase → create a **Sector**  
   - On a sector → create a **Block**  
3. Enter **Name** (and optional **Code** — code can auto-generate)  
4. Click **Create …**  

**Bulk create:** Paste many names (one per line) and use **Bulk create**.

You can also search, filter by status, and **Archive / Restore / Delete** structure items (with safety checks).

---

### Module 7 — House Types, Templates & Houses

This is the heart of the housing register MVP.

#### A. House types & templates (menu: **House types**)

**What it is:**
- A **House type** = typology (e.g. Type A residential)  
- A **Template** = reusable definition for that type (versioned)  
- Template lines = planned **Activities**, **BOQ items**, **Materials** (definitions only for now)

**Create a house type:**
1. Open **House types**  
2. Under **Add house type**, enter **Name** (and optional **Code**)  
3. Choose category: Residential / Commercial / Mixed / Other  
4. Click **Create type**  

**Create a template:**
1. Click a house type on the left  
2. Under **Add template**, enter **Template name**  
3. Click **Create template**  
4. Click the template to open its detail  

**Add template lines:**
- **Add activity** (name, qty, unit)  
- **Add BOQ item**  
- **Add material**  

**Create a new version:**
- Enter a **Revision note** → **Revise template**  
- Old version is archived; new version keeps a history chain  

> **Important for the client:** These template lines are **definitions for later construction modules**. The system does **not** yet run site execution, costing, or payment from them.

#### B. Houses inside a project (**Houses** tab)

**What you see at the top:** counts for **Total**, **Planning**, **Completed**, **Types**.

**Filters:** Phase, Sector, Block, Type, Status.

**Create one house:**
1. Project → **Houses**  
2. Choose **Phase**, **Sector**, **Block**, **House type**  
3. Optionally choose a **Template**  
4. Optional **Code** and **Plot number**  
5. Click **Create house**  

**Import many houses (CSV):**
1. Paste CSV in the import box  
2. Required style headers:

```text
phase,sector,block,type,code,plot,template,owner,notes
```

Example:

```text
phase,sector,block,type,code,plot
PH-001,SEC-A,BLK-01,HT-001,HSE-001,P-12
```

3. Click **Dry run** first (checks errors and duplicates — **no data written yet**)  
4. Review the summary / error report  
5. If clean, click **Commit import**  
6. If commit fails mid-way, the system rolls back those rows  

**Open a house:**
- Click the house code in the table → opens **House detail**

#### C. House detail page

Tabs:

| Tab | Status in MVP |
|---|---|
| **Overview** | Working — status, type, template, owner, notes |
| **Location** | Working — phase/sector/block, plot, GPS |
| **Template** | Working — assigned template summary |
| **Timeline** | Working — status change history |
| **History** | Working — created/updated + status history |
| **Documents** | Placeholder (future) |
| **Activities** | Placeholder (future execution) |
| **BOQ** | Placeholder (future) |
| **Materials** | Placeholder (future) |

---

## 7. Project Dashboard — what the numbers mean

On **Dashboard** you will see:

**Real today**
- Houses / Phases / Sectors / Blocks counts  
- House types count  
- Planning / Completed house counts  
- Project summary, members, deadlines, recent activity  

**Placeholders (shown as 0 / “placeholder” until later modules)**
- Construction progress %, Activities, BOQ, Materials, Budget  
- Contractors, Employees, Inventory, Open IRs  
- Workflow tasks, Documents, Notifications cards  

This is intentional: the cards show where future KPIs will appear.

---

## 8. Permissions (simple explanation)

| Role example | Typical use in demo |
|---|---|
| **Super Admin** | Full demo of everything built |
| **Resident Engineer** | Project / houses / structure oriented |
| **AD Tech** | House types / technical masters |
| Other roles | Seeded for later modules |

If a screen is empty or a button is missing, the signed-in role may not have that permission. Switch to Super Admin for a full tour.

---

## 9. What this MVP proves to the client

You can already:

- Control access with login + roles  
- Mirror the real organization  
- Open and manage housing projects  
- Build Phase → Sector → Block structure  
- Define house typologies and versioned templates  
- Register houses in bulk with safe dry-run import  
- Inspect each house on a dedicated detail page  
- See live structure and house KPIs on the project dashboard  

That is the **project master data backbone** required before contractors, site progress, store, RAR, and payments.

---

## 10. What is intentionally not in this demo

Please do not expect these yet (architecture is ready; build is later):

- Contractor management  
- Live construction activity tracking on site  
- Full BOQ costing engine  
- Yard Stick / RAR / Payment Voucher  
- Measurement Book & government payment documents  
- Store, GRN, material issue  
- Full reports / inbox / notifications vault  

Greyed menu items are reserved for those phases.

---

## 11. Quick troubleshooting during the demo

| Problem | What to try |
|---|---|
| Cannot open a page | Confirm Super Admin (or correct permission) |
| Cannot create a house | Create Phase → Sector → Block first, then a House type |
| CSV import blocked | Run **Dry run**, fix error report (wrong phase/sector/block/type codes or duplicate house codes) |
| Project looks read-only | It may be **Archived** — use **Restore** |
| Template lines don’t change house progress | Expected — execution modules are not built yet |

---

## 12. One-page cheat sheet

```
LOGIN → Projects → Create Project
     → Structure: Phase → Sector → Block
     → House types: Type → Template → (optional lines)
     → Houses: Create or Dry run + Commit CSV
     → Click house → Overview / Location / Timeline
     → Dashboard → review live counts
```

---

*Document version: MVP Modules 0–7*  
*Product name: FAZIA Housing*
