# FAZIA Housing — Prisma Models Design (v1.0)

> Design-only. Multi-file Prisma schema under `prisma/schema/`.  
> Implementation happens after approval.

---

## 0. Shared Enums (excerpt)

```prisma
enum UserStatus { ACTIVE INACTIVE INVITED LOCKED }
enum ProjectStatus { DRAFT ACTIVE ON_HOLD COMPLETED ARCHIVED }
enum HouseStatus { NOT_STARTED IN_PROGRESS HOLD COMPLETED HANDED_OVER }
enum DocumentStatus { DRAFT SUBMITTED UNDER_REVIEW APPROVED REJECTED CANCELLED POSTED }
enum IrResult { PENDING PASS FAIL CONDITIONAL }
enum StockDirection { IN OUT ADJUST }
enum InventoryRefType { GRN ISSUE RETURN CONSUMPTION ADJUSTMENT TRANSFER }
enum WorkflowTaskStatus { PENDING CLAIMED COMPLETED REJECTED CANCELLED }
enum NotificationChannel { IN_APP EMAIL }
enum OrgUnitType { HQ REGION SITE OFFICE STORE FINANCE OTHER }
enum BoqScopeType { PROJECT HOUSE_TYPE PHASE }
enum AssignmentStatus { ACTIVE COMPLETED TERMINATED }
```

---

## 1. Auth & Users

```prisma
model User {
  id             String     @id @default(uuid()) @db.Uuid
  email          String     @unique
  emailVerified  DateTime?
  passwordHash   String?
  name           String
  phone          String?
  avatarUrl      String?
  status         UserStatus @default(INVITED)
  orgUnitId      String?    @db.Uuid
  lastLoginAt    DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  deletedAt      DateTime?
  createdById    String?    @db.Uuid
  updatedById    String?    @db.Uuid

  orgUnit        OrgUnit?   @relation(fields: [orgUnitId], references: [id])
  roles          UserRole[]
  permissions    UserPermission[]
  projectMembers ProjectMember[]
  accounts       Account[]
  sessions       Session[]
  employee       Employee?
  contractorUser Contractor? @relation("ContractorPrimaryUser")
  // ... reverse relations for createdBy/updatedBy omitted for brevity in design

  @@index([orgUnitId])
  @@index([status, deletedAt])
}

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique  // SUPER_ADMIN, ADH, ...
  name        String
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  permissions RolePermission[]
  users       UserRole[]
}

model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique  // e.g. projects.read, grn.post
  module      String
  action      String
  description String?
  createdAt   DateTime @default(now())

  roles RolePermission[]
  users UserPermission[]

  @@index([module])
}

model RolePermission {
  roleId       String @db.Uuid
  permissionId String @db.Uuid
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}

model UserRole {
  userId     String   @db.Uuid
  roleId     String   @db.Uuid
  assignedAt DateTime @default(now())
  assignedBy String?  @db.Uuid
  user       User     @relation(fields: [userId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model UserPermission {
  userId       String  @db.Uuid
  permissionId String  @db.Uuid
  effect       String  // ALLOW | DENY
  user         User       @relation(fields: [userId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([userId, permissionId])
}

// Auth.js models: Account, Session, VerificationToken (standard)
```

### Seed Role Codes

`SUPER_ADMIN`, `ADH`, `AD_TECH`, `RESIDENT_ENGINEER`, `QUALITY_MANAGER`, `CONTRACTOR`, `CONTRACTOR_ENGINEER`, `STORE_OFFICER`, `FINANCE`, `SITE_SUPERVISOR`, `SENIOR_MANAGEMENT`

---

## 2. Organization

```prisma
model OrgUnit {
  id          String      @id @default(uuid()) @db.Uuid
  parentId    String?     @db.Uuid
  code        String      @unique
  name        String
  type        OrgUnitType
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?
  createdById String?     @db.Uuid
  updatedById String?     @db.Uuid

  parent   OrgUnit?  @relation("OrgTree", fields: [parentId], references: [id])
  children OrgUnit[] @relation("OrgTree")
  users    User[]

  @@index([parentId])
}
```

---

## 3. Project Structure

```prisma
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  code        String        @unique
  name        String
  description String?
  location    String?
  status      ProjectStatus @default(DRAFT)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?
  createdById String?       @db.Uuid
  updatedById String?       @db.Uuid

  phases     Phase[]
  houses     House[]
  members    ProjectMember[]
  warehouses Warehouse[]
  // ... other relations
}

model ProjectMember {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @db.Uuid
  userId    String   @db.Uuid
  roleHint  String?  // optional display
  createdAt DateTime @default(now())
  deletedAt DateTime?

  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
}

model Phase {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @db.Uuid
  code        String
  name        String
  sortOrder   Int      @default(0)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  project Project  @relation(fields: [projectId], references: [id])
  sectors Sector[]

  @@unique([projectId, code])
  @@index([projectId, deletedAt])
}

model Sector {
  id          String   @id @default(uuid()) @db.Uuid
  phaseId     String   @db.Uuid
  projectId   String   @db.Uuid
  code        String
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  phase  Phase   @relation(fields: [phaseId], references: [id])
  blocks Block[]

  @@unique([phaseId, code])
  @@index([projectId, deletedAt])
}

model Block {
  id          String   @id @default(uuid()) @db.Uuid
  sectorId    String   @db.Uuid
  projectId   String   @db.Uuid
  code        String
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  sector Sector  @relation(fields: [sectorId], references: [id])
  houses House[]

  @@unique([sectorId, code])
  @@index([projectId, deletedAt])
}

model HouseType {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String?  @db.Uuid  // null = global catalog
  code        String
  name        String
  description String?
  plotArea    Decimal? @db.Decimal(12, 2)
  coveredArea Decimal? @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  houses House[]

  @@unique([projectId, code])
}

model House {
  id           String      @id @default(uuid()) @db.Uuid
  projectId    String      @db.Uuid
  phaseId      String      @db.Uuid
  sectorId     String      @db.Uuid
  blockId      String      @db.Uuid
  houseTypeId  String      @db.Uuid
  code         String      // house number
  plotNo       String?
  status       HouseStatus @default(NOT_STARTED)
  progressPct  Decimal     @default(0) @db.Decimal(5, 2)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  deletedAt    DateTime?
  createdById  String?     @db.Uuid
  updatedById  String?     @db.Uuid
  version      Int         @default(1)

  project   Project   @relation(fields: [projectId], references: [id])
  block     Block     @relation(fields: [blockId], references: [id])
  houseType HouseType @relation(fields: [houseTypeId], references: [id])
  activities HouseActivity[]
  statusHistory HouseStatusHistory[]

  @@unique([blockId, code])
  @@index([projectId, status, deletedAt])
  @@index([sectorId])
  @@index([phaseId])
}

model HouseStatusHistory {
  id         String      @id @default(uuid()) @db.Uuid
  houseId    String      @db.Uuid
  fromStatus HouseStatus?
  toStatus   HouseStatus
  note       String?
  changedById String?    @db.Uuid
  createdAt  DateTime    @default(now())

  house House @relation(fields: [houseId], references: [id])
  @@index([houseId, createdAt])
}
```

---

## 4. Workforce

```prisma
model Contractor {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique
  name            String
  registrationNo  String?
  ntn             String?
  contactPerson   String?
  email           String?
  phone           String?
  address         String?
  primaryUserId   String?  @unique @db.Uuid
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  createdById     String?  @db.Uuid
  updatedById     String?  @db.Uuid

  primaryUser  User? @relation("ContractorPrimaryUser", fields: [primaryUserId], references: [id])
  assignments  ContractorAssignment[]
  bills        ContractorBill[]
}

model ContractorAssignment {
  id           String           @id @default(uuid()) @db.Uuid
  contractorId String           @db.Uuid
  projectId    String           @db.Uuid
  phaseId      String?          @db.Uuid
  contractNo   String?
  startDate    DateTime?
  endDate      DateTime?
  status       AssignmentStatus @default(ACTIVE)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  deletedAt    DateTime?

  contractor Contractor @relation(fields: [contractorId], references: [id])
  @@unique([contractorId, projectId, contractNo])
  @@index([projectId, status])
}

model Employee {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique
  userId      String?  @unique @db.Uuid
  name        String
  designation String?
  department  String?
  email       String?
  phone       String?
  joiningDate DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  user        User? @relation(fields: [userId], references: [id])
  assignments EmployeeAssignment[]
}

model EmployeeAssignment {
  id         String           @id @default(uuid()) @db.Uuid
  employeeId String           @db.Uuid
  projectId  String           @db.Uuid
  roleTitle  String?
  status     AssignmentStatus @default(ACTIVE)
  startDate  DateTime?
  endDate    DateTime?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  deletedAt  DateTime?

  employee Employee @relation(fields: [employeeId], references: [id])
  @@index([projectId, status])
}
```

---

## 5. BOQ & Activities

```prisma
model BoqHeader {
  id          String       @id @default(uuid()) @db.Uuid
  projectId   String       @db.Uuid
  code        String
  title       String
  scopeType   BoqScopeType
  houseTypeId String?      @db.Uuid
  phaseId     String?      @db.Uuid
  revision    Int          @default(1)
  status      DocumentStatus @default(DRAFT)
  effectiveFrom DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  deletedAt   DateTime?
  createdById String?      @db.Uuid
  updatedById String?      @db.Uuid

  items BoqItem[]
  @@unique([projectId, code, revision])
}

model BoqItem {
  id          String  @id @default(uuid()) @db.Uuid
  boqHeaderId String  @db.Uuid
  parentId    String? @db.Uuid
  code        String
  description String
  unit        String
  quantity    Decimal @db.Decimal(14, 3)
  rate        Decimal @db.Decimal(14, 2)
  amount      Decimal @db.Decimal(16, 2)
  sortOrder   Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  header BoqHeader @relation(fields: [boqHeaderId], references: [id])
  parent BoqItem?  @relation("BoqTree", fields: [parentId], references: [id])
  children BoqItem[] @relation("BoqTree")
  activities Activity[]

  @@index([boqHeaderId])
}

model BoqRevision {
  id          String   @id @default(uuid()) @db.Uuid
  boqHeaderId String   @db.Uuid
  revision    Int
  snapshot    Json     // full header+items snapshot
  reason      String?
  createdById String?  @db.Uuid
  createdAt   DateTime @default(now())

  @@unique([boqHeaderId, revision])
}

model Activity {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @db.Uuid
  boqItemId   String?  @db.Uuid
  code        String
  name        String
  description String?
  unit        String?
  weightPct   Decimal? @db.Decimal(5, 2) // for progress rollup
  sequence    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  boqItem BoqItem? @relation(fields: [boqItemId], references: [id])
  houseActivities HouseActivity[]

  @@unique([projectId, code])
}

model HouseActivity {
  id           String   @id @default(uuid()) @db.Uuid
  houseId      String   @db.Uuid
  activityId   String   @db.Uuid
  plannedQty   Decimal? @db.Decimal(14, 3)
  completedQty Decimal  @default(0) @db.Decimal(14, 3)
  progressPct  Decimal  @default(0) @db.Decimal(5, 2)
  status       HouseStatus @default(NOT_STARTED)
  startedAt    DateTime?
  completedAt  DateTime?
  updatedAt    DateTime @updatedAt
  version      Int      @default(1)

  house    House    @relation(fields: [houseId], references: [id])
  activity Activity @relation(fields: [activityId], references: [id])

  @@unique([houseId, activityId])
}
```

---

## 6. Inspection Requests

```prisma
model InspectionRequest {
  id            String        @id @default(uuid()) @db.Uuid
  projectId     String        @db.Uuid
  code          String
  houseId       String        @db.Uuid
  activityId    String?       @db.Uuid
  requestedById String        @db.Uuid
  assignedToId  String?       @db.Uuid
  status        DocumentStatus @default(DRAFT)
  result        IrResult      @default(PENDING)
  scheduledAt   DateTime?
  inspectedAt   DateTime?
  remarks       String?
  rejectionReason String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?
  createdById   String?       @db.Uuid
  updatedById   String?       @db.Uuid
  version       Int           @default(1)

  attachments InspectionAttachment[]
  @@unique([projectId, code])
  @@index([projectId, status, deletedAt])
  @@index([houseId])
}

model InspectionAttachment {
  id         String   @id @default(uuid()) @db.Uuid
  irId       String   @db.Uuid
  fileUrl    String
  fileName   String
  mimeType   String?
  createdAt  DateTime @default(now())
  createdById String? @db.Uuid

  ir InspectionRequest @relation(fields: [irId], references: [id])
}
```

---

## 7. Progress Reports

```prisma
model DailyProgressReport {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  code        String
  reportDate  DateTime       @db.Date
  status      DocumentStatus @default(DRAFT)
  weather     String?
  manpower    Int?
  summary     String?
  submittedAt DateTime?
  approvedAt  DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  createdById String?        @db.Uuid
  updatedById String?        @db.Uuid

  lines DprLine[]
  @@unique([projectId, reportDate])
  @@unique([projectId, code])
}

model DprLine {
  id         String  @id @default(uuid()) @db.Uuid
  dprId      String  @db.Uuid
  houseId    String? @db.Uuid
  activityId String? @db.Uuid
  description String
  quantity   Decimal? @db.Decimal(14, 3)
  unit       String?
  remarks    String?

  dpr DailyProgressReport @relation(fields: [dprId], references: [id])
  @@index([dprId])
}

model WeeklyProgressReport {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  code        String
  weekStart   DateTime       @db.Date
  weekEnd     DateTime       @db.Date
  status      DocumentStatus @default(DRAFT)
  summary     String?
  risks       String?
  submittedAt DateTime?
  approvedAt  DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  createdById String?        @db.Uuid
  updatedById String?        @db.Uuid

  lines WprLine[]
  @@unique([projectId, weekStart])
}

model WprLine {
  id          String  @id @default(uuid()) @db.Uuid
  wprId       String  @db.Uuid
  sectorId    String? @db.Uuid
  activityId  String? @db.Uuid
  plannedPct  Decimal? @db.Decimal(5, 2)
  actualPct   Decimal? @db.Decimal(5, 2)
  remarks     String?

  wpr WeeklyProgressReport @relation(fields: [wprId], references: [id])
}
```

---

## 8. Store & Materials

```prisma
model MaterialCategory {
  id        String   @id @default(uuid()) @db.Uuid
  parentId  String?  @db.Uuid
  code      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  parent   MaterialCategory?  @relation("MatCat", fields: [parentId], references: [id])
  children MaterialCategory[] @relation("MatCat")
  materials Material[]
}

model Material {
  id          String   @id @default(uuid()) @db.Uuid
  categoryId  String?  @db.Uuid
  code        String   @unique
  name        String
  description String?
  unit        String
  minStock    Decimal? @db.Decimal(14, 3)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  category MaterialCategory? @relation(fields: [categoryId], references: [id])
  balances StockBalance[]
  ledger   InventoryLedger[]
}

model Warehouse {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String?  @db.Uuid  // null = central
  code        String
  name        String
  location    String?
  isCentral   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid

  project  Project? @relation(fields: [projectId], references: [id])
  balances StockBalance[]

  @@unique([projectId, code])
}

model StockBalance {
  id          String  @id @default(uuid()) @db.Uuid
  warehouseId String  @db.Uuid
  materialId  String  @db.Uuid
  quantity    Decimal @default(0) @db.Decimal(14, 3)
  avgUnitCost Decimal @default(0) @db.Decimal(14, 4)
  version     Int     @default(1)
  updatedAt   DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  material  Material  @relation(fields: [materialId], references: [id])

  @@unique([warehouseId, materialId])
}

model Grn {
  id            String         @id @default(uuid()) @db.Uuid
  projectId     String?        @db.Uuid
  warehouseId   String         @db.Uuid
  code          String         @unique
  supplierName  String?
  challanNo     String?
  receivedAt    DateTime
  status        DocumentStatus @default(DRAFT)
  remarks       String?
  postedAt      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  createdById   String?        @db.Uuid
  updatedById   String?        @db.Uuid
  version       Int            @default(1)

  lines GrnLine[]
}

model GrnLine {
  id         String  @id @default(uuid()) @db.Uuid
  grnId      String  @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)
  unitCost   Decimal @db.Decimal(14, 4)
  remarks    String?

  grn Grn @relation(fields: [grnId], references: [id])
}

model MaterialRequisition {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  code        String
  requestedById String       @db.Uuid
  neededBy    DateTime?
  status      DocumentStatus @default(DRAFT)
  remarks     String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  version     Int            @default(1)

  lines MrLine[]
  @@unique([projectId, code])
}

model MrLine {
  id         String  @id @default(uuid()) @db.Uuid
  mrId       String  @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)
  remarks    String?

  mr MaterialRequisition @relation(fields: [mrId], references: [id])
}

model DemandVoucher {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  mrId        String?        @db.Uuid
  code        String
  status      DocumentStatus @default(DRAFT)
  remarks     String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  version     Int            @default(1)

  lines DvLine[]
  @@unique([projectId, code])
}

model DvLine {
  id         String  @id @default(uuid()) @db.Uuid
  dvId       String  @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)

  dv DemandVoucher @relation(fields: [dvId], references: [id])
}

model MaterialIssue {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  warehouseId String         @db.Uuid
  dvId        String?        @db.Uuid
  code        String
  issuedToType String        // CONTRACTOR | EMPLOYEE | SITE
  issuedToId  String?
  status      DocumentStatus @default(DRAFT)
  postedAt    DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  version     Int            @default(1)

  lines MiLine[]
  @@unique([projectId, code])
}

model MiLine {
  id         String  @id @default(uuid()) @db.Uuid
  issueId    String  @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)

  issue MaterialIssue @relation(fields: [issueId], references: [id])
}

model MaterialConsumption {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  houseId     String?        @db.Uuid
  activityId  String?        @db.Uuid
  code        String
  status      DocumentStatus @default(DRAFT)
  consumedAt  DateTime
  postedAt    DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  version     Int            @default(1)

  lines McLine[]
  @@unique([projectId, code])
}

model McLine {
  id         String  @id @default(uuid()) @db.Uuid
  consumptionId String @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)

  consumption MaterialConsumption @relation(fields: [consumptionId], references: [id])
}

model MaterialReturn {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  warehouseId String         @db.Uuid
  issueId     String?        @db.Uuid
  code        String
  status      DocumentStatus @default(DRAFT)
  postedAt    DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  version     Int            @default(1)

  lines MretLine[]
  @@unique([projectId, code])
}

model MretLine {
  id         String  @id @default(uuid()) @db.Uuid
  returnId   String  @db.Uuid
  materialId String  @db.Uuid
  quantity   Decimal @db.Decimal(14, 3)

  materialReturn MaterialReturn @relation(fields: [returnId], references: [id])
}

model InventoryLedger {
  id           String          @id @default(uuid()) @db.Uuid
  warehouseId  String          @db.Uuid
  materialId   String          @db.Uuid
  direction    StockDirection
  quantity     Decimal         @db.Decimal(14, 3)
  unitCost     Decimal         @db.Decimal(14, 4)
  balanceAfter Decimal         @db.Decimal(14, 3)
  refType      InventoryRefType
  refId        String          @db.Uuid
  refCode      String?
  projectId    String?         @db.Uuid
  note         String?
  createdById  String?         @db.Uuid
  createdAt    DateTime        @default(now())

  material  Material  @relation(fields: [materialId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])

  @@index([warehouseId, materialId, createdAt])
  @@index([refType, refId])
  @@index([projectId, createdAt])
}
```

---

## 9. Measurement Book, Billing, Finance

```prisma
model MeasurementBook {
  id          String         @id @default(uuid()) @db.Uuid
  projectId   String         @db.Uuid
  contractorId String        @db.Uuid
  code        String
  periodFrom  DateTime?      @db.Date
  periodTo    DateTime?      @db.Date
  status      DocumentStatus @default(DRAFT)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
  createdById String?        @db.Uuid
  updatedById String?        @db.Uuid
  version     Int            @default(1)

  entries MbEntry[]
  @@unique([projectId, code])
}

model MbEntry {
  id         String  @id @default(uuid()) @db.Uuid
  mbId       String  @db.Uuid
  boqItemId  String? @db.Uuid
  houseId    String? @db.Uuid
  description String
  unit       String?
  quantity   Decimal @db.Decimal(14, 3)
  rate       Decimal @db.Decimal(14, 2)
  amount     Decimal @db.Decimal(16, 2)
  remarks    String?

  mb MeasurementBook @relation(fields: [mbId], references: [id])
}

model ContractorBill {
  id            String         @id @default(uuid()) @db.Uuid
  projectId     String         @db.Uuid
  contractorId  String         @db.Uuid
  mbId          String?        @db.Uuid
  code          String
  billDate      DateTime       @db.Date
  grossAmount   Decimal        @db.Decimal(16, 2)
  retentionPct  Decimal        @default(0) @db.Decimal(5, 2)
  retentionAmt  Decimal        @default(0) @db.Decimal(16, 2)
  deductions    Decimal        @default(0) @db.Decimal(16, 2)
  netAmount     Decimal        @db.Decimal(16, 2)
  status        DocumentStatus @default(DRAFT)
  submittedAt   DateTime?
  approvedAt    DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  createdById   String?        @db.Uuid
  updatedById   String?        @db.Uuid
  version       Int            @default(1)

  contractor Contractor @relation(fields: [contractorId], references: [id])
  lines      ContractorBillLine[]
  history    ContractorBillHistory[]
  payments   Payment[]

  @@unique([projectId, code])
  @@index([contractorId, status])
}

model ContractorBillLine {
  id      String  @id @default(uuid()) @db.Uuid
  billId  String  @db.Uuid
  boqItemId String? @db.Uuid
  description String
  quantity Decimal @db.Decimal(14, 3)
  rate     Decimal @db.Decimal(14, 2)
  amount   Decimal @db.Decimal(16, 2)

  bill ContractorBill @relation(fields: [billId], references: [id])
}

model ContractorBillHistory {
  id         String   @id @default(uuid()) @db.Uuid
  billId     String   @db.Uuid
  fromStatus DocumentStatus?
  toStatus   DocumentStatus
  snapshot   Json
  note       String?
  createdById String? @db.Uuid
  createdAt  DateTime @default(now())

  bill ContractorBill @relation(fields: [billId], references: [id])
}

model Budget {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @db.Uuid
  code      String
  title     String
  fiscalYear String?
  totalAmount Decimal @db.Decimal(16, 2)
  status    DocumentStatus @default(DRAFT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  lines BudgetLine[]
  @@unique([projectId, code])
}

model BudgetLine {
  id          String  @id @default(uuid()) @db.Uuid
  budgetId    String  @db.Uuid
  category    String
  description String?
  amount      Decimal @db.Decimal(16, 2)

  budget Budget @relation(fields: [budgetId], references: [id])
}

model Payment {
  id          String   @id @default(uuid()) @db.Uuid
  billId      String   @db.Uuid
  code        String   @unique
  amount      Decimal  @db.Decimal(16, 2)
  paidAt      DateTime
  method      String?
  referenceNo String?
  status      DocumentStatus @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid

  bill ContractorBill @relation(fields: [billId], references: [id])
}
```

---

## 10. Governance & Platform

```prisma
model Directive {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String?  @db.Uuid
  code        String   @unique
  title       String
  body        String
  priority    String   @default("NORMAL")
  issuedAt    DateTime @default(now())
  dueAt       DateTime?
  status      DocumentStatus @default(SUBMITTED)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid

  acknowledgements DirectiveAcknowledgement[]
}

model DirectiveAcknowledgement {
  id          String   @id @default(uuid()) @db.Uuid
  directiveId String   @db.Uuid
  userId      String   @db.Uuid
  acknowledgedAt DateTime @default(now())
  note        String?

  directive Directive @relation(fields: [directiveId], references: [id])
  @@unique([directiveId, userId])
}

model Document {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String?  @db.Uuid
  folder      String?
  title       String
  fileUrl     String
  fileName    String
  mimeType    String?
  sizeBytes   Int?
  checksum    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  createdById String?  @db.Uuid

  links DocumentLink[]
}

model DocumentLink {
  id         String @id @default(uuid()) @db.Uuid
  documentId String @db.Uuid
  entityType String
  entityId   String @db.Uuid

  document Document @relation(fields: [documentId], references: [id])
  @@index([entityType, entityId])
}

model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  title     String
  body      String?
  linkUrl   String?
  isRead    Boolean  @default(false)
  readAt    DateTime?
  channel   NotificationChannel @default(IN_APP)
  meta      Json?
  createdAt DateTime @default(now())

  @@index([userId, isRead, createdAt])
}

model WorkflowDefinition {
  id           String @id @default(uuid()) @db.Uuid
  documentType String @unique
  name         String
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  transitions WorkflowTransition[]
}

model WorkflowTransition {
  id           String @id @default(uuid()) @db.Uuid
  definitionId String @db.Uuid
  fromStatus   DocumentStatus
  toStatus     DocumentStatus
  requiredPermission String?
  assigneeRoleCode   String?

  definition WorkflowDefinition @relation(fields: [definitionId], references: [id])
  @@index([definitionId])
}

model WorkflowInstance {
  id           String @id @default(uuid()) @db.Uuid
  definitionId String @db.Uuid
  documentType String
  documentId   String @db.Uuid
  currentStatus DocumentStatus
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tasks WorkflowTask[]
  @@unique([documentType, documentId])
}

model WorkflowTask {
  id         String             @id @default(uuid()) @db.Uuid
  instanceId String             @db.Uuid
  title      String
  assigneeId String?            @db.Uuid
  roleCode   String?
  status     WorkflowTaskStatus @default(PENDING)
  dueAt      DateTime?
  completedAt DateTime?
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  instance WorkflowInstance @relation(fields: [instanceId], references: [id])
  @@index([assigneeId, status])
  @@index([roleCode, status])
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  actorId    String?  @db.Uuid
  action     String
  entityType String
  entityId   String?  @db.Uuid
  projectId  String?  @db.Uuid
  ip         String?
  userAgent  String?
  before     Json?
  after      Json?
  meta       Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([actorId, createdAt])
  @@index([projectId, createdAt])
}
```

---

## 11. Integrity Rules Enforced in Services (not only DB)

1. House `phaseId/sectorId/projectId` must match parent Block chain.
2. Cannot post Issue if `StockBalance.quantity < required` (unless override permission).
3. Cannot edit POSTED inventory documents; reverse via Return/Adjustment.
4. Bill netAmount = gross - retention - deductions (recomputed server-side).
5. Soft-deleted rows excluded from all default queries.
6. Permission check before every state transition.
