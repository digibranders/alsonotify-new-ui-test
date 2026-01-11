# Alsonotify Frontend (alsonotify-new-ui)

This is the frontend repository for **Alsonotify**, a modern Project Tracker and Agency Finance Operations platform. It is built with **Next.js 16**, **React 19**, and typed strictly with **TypeScript**.

## 🚀 Tech Stack

-   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [Ant Design v6](https://ant.design/)
-   **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
-   **State/Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Calendar**: [FullCalendar](https://fullcalendar.io/)
-   **Utilities**: `date-fns`, `dayjs`, `clsx`, `tailwind-merge`

## 🛠️ Prerequisites

-   **Node.js**: v20 or higher is recommended.
-   **npm**: v10+

## 🏁 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd alsonotify-new-ui
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Ensure your `.env` contains the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Scripts

| Command             | Description                                        |
| :------------------ | :------------------------------------------------- |
| `npm run dev`       | Starts the Next.js development server.             |
| `npm run build`     | Builds the application for production.             |
| `npm run start`     | Starts the production server.                      |
| `npm run lint`      | Runs ESLint to check for code quality issues.      |
| `npm run typecheck` | Runs TypeScript compiler to check for type errors. |
| `npm run test`      | Runs unit tests using Vitest.                      |
| `npm run analyze`   | Analyzes bundle size.                              |

## 📂 Project Structure

```
src/
├── app/             # App Router pages and layouts
├── components/      # Reusable UI components
│   ├── ui/          # Generic design system components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and libraries
├── services/        # API service layers
├── styles/          # Global styles and Tailwind configuration
└── types/           # TypeScript type definitions
```

## 🔒 Engineering Standards

-   **Strict Typing**: Avoid `any`. Use strict interfaces.
-   **Optimization**: Components are optimized for minimal re-renders.
-   **Linting**: Strict ESLint rules are enforced.
