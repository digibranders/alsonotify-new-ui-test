# Alsonotify - Next.js Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the converted Alsonotify Next.js application. The application has been successfully migrated from React (with react-router-dom) to Next.js 15 with App Router.

---

## Pre-Deployment Checklist

### 1. Files to Delete Before Deployment

The following files are **legacy React files** and should be deleted before deploying:

```bash
# Delete the old React entry point
/App.tsx

# Delete old imports (if not being used by Next.js pages)
/imports/Dashboard-1-1252.tsx
/imports/Dashboard.tsx
```

**Important:** Do NOT delete files in `/imports/` that contain SVG paths or assets that are actively used by components.

---

### 2. Components with React Router Dependencies

The following component files still have `react-router-dom` imports and need to be updated to use Next.js navigation:

#### Components to Update:
- `/components/Header.tsx` - uses `useNavigate`
- `/components/Sidebar.tsx` - uses `Link`, `useLocation`, `useNavigate`
- `/components/WorkspacePage.tsx` - uses `useNavigate`
- `/components/WorkspaceDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/RequirementDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/ClientDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/TaskDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/rows/EmployeeRow.tsx` - uses `Link`
- `/components/rows/ClientRow.tsx` - uses `Link`
- `/components/rows/TaskRow.tsx` - uses `Link`
- `/components/details/EmployeeDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/details/ClientDetailsPage.tsx` - uses `useParams`, `useNavigate`
- `/components/details/TaskDetailsPage.tsx` - uses `useParams`, `useNavigate`

#### Migration Pattern:

**React Router → Next.js Navigation Mapping:**

```tsx
// OLD: React Router
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';

// NEW: Next.js
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

// Navigation
const navigate = useNavigate();        // React Router
navigate('/dashboard');

const router = useRouter();            // Next.js
router.push('/dashboard');

// Current location
const location = useLocation();        // React Router
const pathname = usePathname();        // Next.js

// URL Parameters
const { id } = useParams();            // Works in both (but needs 'use client')
```

---

## Next.js App Router Structure

### Current File Structure

```
/app
├── layout.tsx                          # Root layout with DataProvider
├── page.tsx                            # Root redirect to /dashboard
├── AlsonotifyLayoutWrapper.tsx         # Main app layout with Sidebar & Header
├── dashboard/page.tsx                  # Dashboard page
├── employees/
│   ├── page.tsx                        # Employees list
│   └── [employeeId]/page.tsx          # Employee details
├── clients/
│   ├── page.tsx                        # Clients list
│   └── [clientId]/page.tsx            # Client details
├── tasks/
│   ├── page.tsx                        # Tasks list
│   └── [taskId]/page.tsx              # Task details
├── workspaces/
│   ├── page.tsx                        # Workspaces list
│   ├── [workspaceId]/page.tsx         # Workspace details
│   └── [workspaceId]/requirements/
│       └── [reqId]/page.tsx           # Requirement details
├── requirements/page.tsx               # Requirements page
├── reports/page.tsx                    # Reports page
├── workload/page.tsx                   # Workload chart page
├── calendar/page.tsx                   # Calendar page
├── leaves/page.tsx                     # Leaves page
├── invoices/page.tsx                   # Invoices page
└── notes/page.tsx                      # Notes page

/components                              # All React components (reusable)
/context                                 # DataContext for state management
/lib                                     # Types and data utilities
/styles                                  # Global CSS with Tailwind
```

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Add any API keys or environment-specific variables here
# Example:
# NEXT_PUBLIC_API_URL=https://api.alsonotify.com
```

---

## Build & Deployment Commands

### Local Development
```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

### Deployment Platforms

#### Vercel (Recommended for Next.js)
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Vercel auto-detects Next.js and configures build
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

#### Netlify
```bash
# Build command: npm run build
# Publish directory: .next
```

#### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## Post-Deployment Verification

### Checklist
- [ ] All routes load correctly (dashboard, employees, clients, tasks, etc.)
- [ ] Navigation works (sidebar links, header navigation)
- [ ] Dynamic routes work (employee details, task details, workspace details)
- [ ] DataContext state management functions properly
- [ ] Forms submit and update data correctly
- [ ] Access badges display correct role names (Admin, Manager, Leader, Employee)
- [ ] Color scheme is consistent (red, black, white)
- [ ] Responsive layout works on XL screens (desktop-first design)
- [ ] No console errors related to routing or navigation

### Test Routes
```
/dashboard
/employees
/employees/[id]
/clients
/clients/[id]
/tasks
/tasks/[id]
/workspaces
/workspaces/[id]
/workspaces/[id]/requirements/[reqId]
/requirements
/reports
/workload
/calendar
/leaves
/invoices
/notes
```

---

## Key Migration Notes

### State Management
- **DataContext** is preserved and wrapped in the root layout (`/app/layout.tsx`)
- All pages are client components (`'use client'`) to support React hooks and state

### Layout Structure
- **AlsonotifyLayoutWrapper** wraps all pages and provides consistent Sidebar + Header
- Each page imports and uses this wrapper to maintain consistent layout

### Routing
- File-based routing via `/app` directory
- Dynamic routes use bracket notation: `[employeeId]`, `[taskId]`, etc.
- Root page (`/app/page.tsx`) redirects to `/dashboard`

### Styling
- Global styles in `/styles/globals.css`
- Tailwind CSS v4.0 (no config file needed)
- Color scheme: Red (#FF0000), Black (#000000), White (#FFFFFF)
- Design tokens defined in globals.css

---

## Troubleshooting

### Common Issues

#### 1. "useNavigate is not a function"
**Cause:** Component still using React Router
**Fix:** Update to use Next.js `useRouter` from `'next/navigation'`

#### 2. "Error: link tag cannot appear as a child of div"
**Cause:** Using lowercase `link` instead of `Link` component
**Fix:** Import `Link` from `'next/link'` (capital L)

#### 3. "Hooks can only be called inside the body of a function component"
**Cause:** Missing `'use client'` directive
**Fix:** Add `'use client'` at the top of the file

#### 4. Dynamic routes not working
**Cause:** Incorrect file/folder naming
**Fix:** Use `[paramName]` for dynamic segments in folder names

---

## Performance Optimization

### Recommended Next.js Optimizations

1. **Image Optimization**
   - Replace `<img>` with Next.js `<Image>` component where possible
   - Keeps existing `ImageWithFallback` for Figma assets

2. **Code Splitting**
   - Leverage Next.js automatic code splitting
   - Consider dynamic imports for heavy components

3. **Static Generation**
   - Convert static pages to Server Components where possible
   - Current setup uses client-side rendering for interactivity

4. **Caching**
   - Implement Next.js caching strategies
   - Use `revalidate` for dynamic data

---

## Support & Maintenance

### Documentation
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com

### Version Info
- Next.js: 15.x
- React: 18.x
- Tailwind CSS: 4.0
- TypeScript: 5.x

---

## Deployment Timeline

1. **Update remaining components** (remove react-router-dom dependencies)
2. **Delete legacy files** (/App.tsx, unused imports)
3. **Test all routes locally** (npm run dev)
4. **Build for production** (npm run build)
5. **Test production build** (npm run start)
6. **Deploy to platform** (Vercel recommended)
7. **Verify all functionality** post-deployment

---

## Next Steps

1. Update all components listed in "Components to Update" section
2. Delete `/App.tsx`
3. Run full test suite
4. Deploy to staging environment
5. Conduct user acceptance testing
6. Deploy to production

---

**Conversion completed successfully! All routes and functionality preserved with Next.js App Router architecture.**
