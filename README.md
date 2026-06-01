# Quiz SaaS Platform

A comprehensive Quiz SaaS Platform built with Next.js 15, TypeScript, Tailwind CSS, and Prisma ORM.

## Features

### For Users
- User registration and authentication
- Browse and take quizzes by category
- Timed quiz experience with auto-submit
- Question navigation with flagging
- View detailed results with explanations
- Track quiz history and performance analytics
- Purchase subscription plans via manual payment

### For Admins
- Manage users and subscriptions
- Create and manage subscription plans
- Organize quizzes by categories
- Create quizzes with multiple question types
- Verify manual payments and activate subscriptions
- View platform analytics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom Shadcn-style components
- **Database**: PostgreSQL (Prisma Postgres)
- **ORM**: Prisma
- **Authentication**: JWT with HttpOnly cookies
- **Validation**: Zod
- **Forms**: React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or Prisma Postgres account)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL`: Your Prisma Postgres connection string
- `JWT_SECRET`: A secure random string (at least 32 characters)

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push the database schema:
```bash
npm run db:push
```

6. Seed the database with test data:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Test Credentials

After seeding, you can log in with:

- **Admin**: admin@quizapp.com / admin123
- **User**: john@example.com / user123

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Seed the database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset and reseed database
npm run db:reset
```

## Project Structure

```
quiz-app/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (public)/         # Public pages (home, pricing, about)
│   ├── admin/            # Admin dashboard pages
│   ├── api/              # API routes
│   ├── dashboard/        # User dashboard pages
│   └── types/            # TypeScript types
├── components/
│   └── ui/               # UI components
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Prisma client
│   ├── errors.ts         # Error handling
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
└── public/               # Static assets
```

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Routes
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `PATCH /api/user/password` - Change password
- `GET /api/user/subscription` - Get active subscription

### Quiz Routes
- `GET /api/quizzes` - List published quizzes
- `GET /api/quizzes/[id]` - Get quiz details
- `POST /api/quizzes/[id]/attempt` - Start/resume quiz attempt
- `POST /api/quizzes/[id]/answer` - Save answer
- `POST /api/quizzes/[id]/submit` - Submit quiz

### Payment Routes
- `GET /api/plans` - List subscription plans
- `POST /api/payments` - Create payment
- `GET /api/payments/[id]` - Get payment details

### Admin Routes
- `GET /api/admin/users` - List users
- `GET /api/admin/plans` - List plans
- `POST /api/admin/plans` - Create plan
- `PATCH /api/admin/plans/[id]` - Update plan
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/quizzes` - List quizzes
- `POST /api/admin/quizzes` - Create quiz
- `GET /api/admin/payments` - List payments
- `POST /api/admin/payments/[id]/verify` - Verify payment

## Payment Flow

1. User selects a subscription plan
2. User views payment QR code and makes payment
3. User enters UTR number and uploads screenshot
4. Admin reviews and approves/rejects payment
5. On approval, subscription is activated automatically

 
## Testing
 - Admin: admin@quizapp.com / admin123
 - User: john@example.com / user123

