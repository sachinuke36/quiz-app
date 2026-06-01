import type {
  User,
  Plan,
  Subscription,
  Payment,
  Category,
  Quiz,
  Question,
  Option,
  QuizAttempt,
  Answer,
  Role,
  SubscriptionStatus,
  PaymentStatus,
  QuestionType,
} from "@/app/generated/prisma/client";

// Re-export Prisma types
export type {
  User,
  Plan,
  Subscription,
  Payment,
  Category,
  Quiz,
  Question,
  Option,
  QuizAttempt,
  Answer,
  Role,
  SubscriptionStatus,
  PaymentStatus,
  QuestionType,
};

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AuthUserWithSubscription extends AuthUser {
  subscriptions: (Subscription & { plan: Plan })[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Quiz types
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[];
  category?: Category | null;
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface QuestionWithOptions extends Question {
  options: Option[];
}

// Attempt types
export interface AttemptWithDetails extends QuizAttempt {
  quiz: Quiz;
  answers: AnswerWithQuestion[];
}

export interface AnswerWithQuestion extends Answer {
  question: QuestionWithOptions;
}

// Payment types
export interface PaymentWithDetails extends Payment {
  user: Pick<User, "id" | "name" | "email">;
  plan: Plan;
  verifiedBy?: Pick<User, "id" | "name"> | null;
}

// Subscription types
export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

// Analytics types
export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalQuizzes: number;
  pendingPayments: number;
  totalAttempts: number;
}

export interface QuizStats {
  quizId: string;
  title: string;
  attempts: number;
  avgScore: number;
  passRate: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

// Table column types
export interface ColumnDef<T> {
  accessorKey?: keyof T | string;
  header: string;
  cell?: (info: { row: { original: T } }) => React.ReactNode;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface QuizFilters {
  categoryId?: string;
  isPublished?: boolean;
  search?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  userId?: string;
}

export interface UserFilters {
  role?: Role;
  search?: string;
}
