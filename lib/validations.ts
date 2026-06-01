import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Plan schemas
export const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  isActive: z.boolean().default(true),
});

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

// Quiz schemas
export const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().min(0, "Total marks must be positive"),
  passingMarks: z.number().min(0, "Passing marks must be positive"),
  isPublished: z.boolean().default(false),
});

// Question schemas
export const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  explanation: z.string().optional(),
  marks: z.number().min(1, "Marks must be at least 1"),
  type: z.enum(["SINGLE_CORRECT", "MULTIPLE_CORRECT"]),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
}).refine((data) => {
  const correctOptions = data.options.filter(o => o.isCorrect);
  if (data.type === "SINGLE_CORRECT") {
    return correctOptions.length === 1;
  }
  return correctOptions.length >= 1;
}, {
  message: "Invalid number of correct options for the question type",
  path: ["options"],
});

// Payment schemas
export const paymentSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  utrNumber: z.string().min(1, "UTR number is required"),
  screenshotUrl: z.string().url("Invalid screenshot URL").optional(),
  amount: z.number().min(1, "Amount must be positive"),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

// Quiz attempt schemas
export const submitAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionIds: z.array(z.string()),
});

export const submitQuizSchema = z.object({
  attemptId: z.string(),
  answers: z.array(submitAnswerSchema),
});

// Settings schema
export const settingsSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type OptionInput = z.infer<typeof optionSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
