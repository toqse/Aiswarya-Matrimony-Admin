

# AIswarya Matrimony Platform — Admin Dashboard System

## Brand Colors
- **Primary**: `#8B2357` (Deep Magenta/Maroon)
- **Accent**: `#FFB727` (Golden Amber)
- **Soft Background**: `#FFE5E0` (Blush Pink)
- **Clean Base**: `#FFFFFF` (White)

## Architecture
A single-page app with a **role switcher** in the header allowing instant toggling between Admin, Staff, and Branch Manager views. Each role has its own sidebar navigation and dashboard sections. All data is mock/demo data — no backend needed.

---

## 1. Shared Layout & Navigation
- **Collapsible sidebar** with role-specific menu items, icons, and active route highlighting
- **Top header bar** with: Logo, Role Switcher dropdown (Admin / Staff / Branch Manager), Notification bell with unread count, Profile avatar with dropdown
- **Breadcrumb navigation** on all inner pages
- Color theme: Sidebar uses `#8B2357` background with white text, accent highlights in `#FFB727`

---

## 2. Admin Dashboard (Full System Access)

### 2.1 Main Dashboard Page
- **KPI Cards Row**: Total Users, Total Subscriptions, Monthly Recurring Revenue (MRR), Active Profiles, Today's Registrations, Total Revenue — with trend indicators and mini sparkline charts
- **Revenue Chart**: Area/bar chart showing monthly revenue (last 12 months) using Recharts
- **Subscription Growth Chart**: Line chart of subscription trends
- **Branch Performance Comparison**: Bar chart comparing all branches
- **Recent Activity Feed**: Live feed of latest system actions

### 2.2 Branch Management
- Full CRUD table: Branch name, code, city, state, phone, email, status (active/inactive)
- Add/Edit branch dialog with form validation
- Per-branch performance cards showing profiles, revenue, staff count
- Toggle active/inactive with confirmation

### 2.3 Staff Management
- Staff table: Employee code, name, branch, designation, salary, commission rate, targets, status
- Add/Edit staff dialog with all fields (salary, commission %, targets)
- Performance history per staff member
- Assign/reassign staff to branches

### 2.4 Subscription Plans Management
- Plans table: Name, duration, price, features (interests, contact views, horoscope, highlighted)
- Create/Edit plan dialog
- Activate/Deactivate plans
- Feature comparison matrix view

### 2.5 All Subscriptions Ledger
- System-wide table: Customer, Plan, Amount, Payment Mode (cash/UPI/card/netbanking), Staff, Branch, Start/Expiry, Status
- Filters: Branch, Plan, Status, Date Range, Payment Mode
- Export to CSV button
- Status badges (Active/Expired/Cancelled)

### 2.6 All Commissions
- Commission table: Date, Staff, Customer, Plan, Sale Amount, Rate %, Commission Amount, Status
- Bulk Approve / Bulk Pay buttons with checkbox selection
- Status badges: Pending (yellow), Approved (blue), Paid (green), Cancelled (red)
- Filter by branch, staff, status, date range

### 2.7 Salary & Payroll
- System-wide salary table: Staff, Branch, Month, Year, Basic, Commission, Allowances, Deductions, Gross, Net, Status
- Generate monthly salary records button
- Approve / Mark Paid workflow with status transitions (Draft → Approved → Paid)
- Download salary slip (PDF mock)

### 2.8 Profile Administration
- Profile table: Profile ID, Name, Gender, Age, Religion, Caste, Marital Status, Subscription, Verified, Complete %
- View/Edit profile dialog with all sections (personal, education, career, family, location, horoscope, photos, preferences)
- Verify/Unverify toggle
- Merge profiles action
- Delete with confirmation

### 2.9 Bulk Upload
- CSV/Excel file upload area with drag & drop
- Template download button
- Upload preview table showing parsed rows with validation status
- Column mapping interface
- Progress bar during processing
- Success/error summary with downloadable error report

### 2.10 Enquiry Overview
- System-wide lead pipeline: Kanban board view (New → Contacted → Interested → Converted → Lost)
- Table view toggle
- Assignment controls to assign leads to staff
- Filter by branch, source, status

### 2.11 Cash Payment Control Center (Layer 8 Dashboard)
- **Today's Cash Collections**: Per-branch table — Expected vs Physical vs Deposited with status indicators
- **Pending Bank Deposits**: Branches with overdue deposits highlighted
- **Receipt Book Status**: Staff receipt ranges — used/remaining/gap alerts
- **Staff Cash Performance**: Per-staff cash totals, averages, discrepancy history
- **Monthly Cash Summary**: Branch-wise cash vs digital payment comparison chart
- **Discrepancy History Log**: Past shortages with staff names, amounts, explanations
- **Anomaly Alerts Panel**: Auto-detected suspicious patterns with suggested actions

### 2.12 Reports & Analytics
- Revenue reports with date range filters and charts
- Staff productivity reports
- Community-wise analytics (religion/caste distribution)
- Subscription growth trends
- Lead source breakdown (doughnut chart)

### 2.13 Email Templates
- Template list: Registration, Match Notification, Interest Alert, Subscription Confirmation, Expiry Reminder, Password Reset
- Edit template with preview
- Variable placeholders shown

### 2.14 System Settings
- OTP expiry duration
- Match score thresholds
- Commission rules
- Notification schedules
- Maintenance mode toggle

### 2.15 Audit Log
- Immutable action log: Timestamp, User, Role, Action, IP Address, Details
- Search and filter by user, action type, date range

---

## 3. Staff Dashboard

### 3.1 Main Dashboard
- **KPI Row**: My Profile Count, Subscriptions This Month, Revenue This Month, Commission Earned — with colorful cards

### 3.2 My Commissions
- Filter bar: Date range, status, plan type
- Commission table: Date, Customer, Plan, Sale Amount, Rate %, Commission, Status, Action
- Summary cards: Total Pending, Approved, Paid
- Monthly commission bar chart (12 months)
- Export button

### 3.3 My Salary
- Salary history table: Month, Year, Basic, Commission, Allowances, Deductions, Gross, Net, Status, Download
- Current month live preview
- Year-to-date summary cards
- Download PDF slip button per row

### 3.4 My Profiles
- Profile grid/table with search and filters
- Status filters: All, Incomplete, Complete, Subscribed, Unsubscribed, Verified, Unverified
- Create new profile button with full form

### 3.5 Enquiry & Lead Management
- Kanban board: New → Contacted → Interested → Converted → Lost
- Add Enquiry form (source: website/phone/whatsapp/email/walk-in)
- Follow-up log timeline per lead
- Overdue follow-ups highlighted in red
- Convert to Subscription button
- Lead source doughnut chart

### 3.6 Subscription Management
- Subscriptions sold table with plan, amount, dates, payment mode
- Add Subscription flow (with cash receipt fields, cashier receipt, customer OTP step)
- Renew Subscription quick flow
- Expiry alerts for subscriptions expiring in 30 days

### 3.7 Cash Payment Entry Flow
- Step-by-step subscription entry for cash:
  1. Select customer & plan
  2. Enter Receipt Number + Cashier Receipt Number
  3. Enter amount, verify details
  4. OTP sent to customer — OTP input field
  5. Confirmation & activation
- Receipt number validation (range check, duplicate check, sequential gap warning)

### 3.8 Activity Log
- Personal audit trail: Profiles created, subscriptions added, commissions earned, enquiries updated

---

## 4. Branch Manager Dashboard

### 4.1 Main Dashboard (Branch Overview)
- Branch KPI cards: Total Profiles, Total Subscriptions, Total Revenue, Active Staff Count
- Branch revenue trend chart
- Staff performance comparison chart

### 4.2 Staff Performance Table
- All staff in branch: Profiles created, Subscriptions sold, Revenue generated, Commission earned, Targets vs Actual
- Performance bars/progress indicators

### 4.3 Commission Approval
- Approve/reject staff commissions within the branch
- Bulk approve functionality

### 4.4 Salary Management (Branch)
- Generate monthly salary for branch staff
- Approve salary records
- View salary history for all branch staff

### 4.5 Day-Close & Cash Settlement
- Generate Day-Close Report button
- Expected vs Physical Cash comparison
- Per-staff receipt breakdown
- Discrepancy flagging and explanation entry
- Bank deposit slip upload area
- Settlement status (Settled/Shortage)

### 4.6 All Staff Sections
- Branch Manager also has access to all Staff dashboard sections (My Commissions, My Salary, My Profiles, Enquiries, Subscriptions) for their own personal data

---

## 5. Extra Features (Standard Platform Additions)
- **Dark mode toggle** in header
- **Search bar** with global search across profiles, subscriptions, staff
- **Data export** (CSV) on all tables
- **Pagination & sorting** on all data tables
- **Responsive design** — works on tablet and desktop
- **Toast notifications** for all actions (create, update, delete, approve)
- **Confirmation dialogs** for destructive actions
- **Loading skeletons** for data tables
- **Empty states** with illustrations for sections with no data
- **Quick stats tooltips** on KPI cards

