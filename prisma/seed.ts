import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.answer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();

  console.log("✅ Cleaned existing data");

  // Create admin user
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@quizapp.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create regular user
  const userPassword = bcrypt.hashSync("user123", 10);
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordHash: userPassword,
      role: "USER",
    },
  });
  console.log("✅ Created test user:", user.email);

  // Create plans
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Basic Plan",
        description: "Access to all quizzes for 30 days",
        price: 499,
        durationDays: 30,
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Pro Plan",
        description: "Access to all quizzes for 90 days with analytics",
        price: 1299,
        durationDays: 90,
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Premium Plan",
        description: "Unlimited access for 365 days with premium support",
        price: 3999,
        durationDays: 365,
        isActive: true,
      },
    }),
  ]);
  console.log("✅ Created", plans.length, "plans");

  // Give user an active subscription
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plans[0].id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });
  console.log("✅ Created subscription for test user");

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "JavaScript",
        description: "Test your JavaScript knowledge",
      },
    }),
    prisma.category.create({
      data: {
        name: "Python",
        description: "Python programming challenges",
      },
    }),
    prisma.category.create({
      data: {
        name: "React",
        description: "React framework questions",
      },
    }),
    prisma.category.create({
      data: {
        name: "General Knowledge",
        description: "Test your general knowledge",
      },
    }),
  ]);
  console.log("✅ Created", categories.length, "categories");

  // Create quizzes with questions
  await prisma.quiz.create({
    data: {
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics including variables, functions, and DOM manipulation.",
      categoryId: categories[0].id,
      durationMinutes: 15,
      totalMarks: 10,
      passingMarks: 6,
      isPublished: true,
      questions: {
        create: [
          {
            question: "What is the correct way to declare a variable in JavaScript?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "In JavaScript, you can declare variables using var, let, or const keywords.",
            options: {
              create: [
                { text: "variable x = 5", isCorrect: false },
                { text: "let x = 5", isCorrect: true },
                { text: "int x = 5", isCorrect: false },
                { text: "x := 5", isCorrect: false },
              ],
            },
          },
          {
            question: "Which of the following is NOT a primitive data type in JavaScript?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Array is an object type, not a primitive. Primitives include string, number, boolean, undefined, null, symbol, and bigint.",
            options: {
              create: [
                { text: "String", isCorrect: false },
                { text: "Number", isCorrect: false },
                { text: "Array", isCorrect: true },
                { text: "Boolean", isCorrect: false },
              ],
            },
          },
          {
            question: "What does '===' operator do in JavaScript?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "The === operator performs strict equality comparison, checking both value and type.",
            options: {
              create: [
                { text: "Assigns a value", isCorrect: false },
                { text: "Compares values with type coercion", isCorrect: false },
                { text: "Compares values and types strictly", isCorrect: true },
                { text: "Checks if values are not equal", isCorrect: false },
              ],
            },
          },
          {
            question: "Which method adds an element to the end of an array?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "push() adds one or more elements to the end of an array and returns the new length.",
            options: {
              create: [
                { text: "pop()", isCorrect: false },
                { text: "push()", isCorrect: true },
                { text: "shift()", isCorrect: false },
                { text: "unshift()", isCorrect: false },
              ],
            },
          },
          {
            question: "What is the output of: typeof null?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "This is a known bug in JavaScript. typeof null returns 'object' instead of 'null'.",
            options: {
              create: [
                { text: '"null"', isCorrect: false },
                { text: '"undefined"', isCorrect: false },
                { text: '"object"', isCorrect: true },
                { text: '"number"', isCorrect: false },
              ],
            },
          },
          {
            question: "Which of the following are valid ways to create a function?",
            type: "MULTIPLE_CORRECT",
            marks: 2,
            explanation: "JavaScript supports function declarations, function expressions, and arrow functions.",
            options: {
              create: [
                { text: "function myFunc() {}", isCorrect: true },
                { text: "const myFunc = function() {}", isCorrect: true },
                { text: "const myFunc = () => {}", isCorrect: true },
                { text: "func myFunc() {}", isCorrect: false },
              ],
            },
          },
          {
            question: "What does the 'this' keyword refer to in a regular function?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "In a regular function, 'this' refers to the object that called the function, or the global object in non-strict mode.",
            options: {
              create: [
                { text: "Always the global object", isCorrect: false },
                { text: "The function itself", isCorrect: false },
                { text: "The object that called the function", isCorrect: true },
                { text: "Undefined", isCorrect: false },
              ],
            },
          },
          {
            question: "Which statement about 'let' and 'const' is true?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "Both let and const are block-scoped and not hoisted like var. const cannot be reassigned.",
            options: {
              create: [
                { text: "Both can be redeclared", isCorrect: false },
                { text: "const can be reassigned", isCorrect: false },
                { text: "Both are function-scoped", isCorrect: false },
                { text: "Both are block-scoped", isCorrect: true },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Created JavaScript quiz with questions");

  await prisma.quiz.create({
    data: {
      title: "React Essentials",
      description: "Test your understanding of React components, hooks, and state management.",
      categoryId: categories[2].id,
      durationMinutes: 20,
      totalMarks: 10,
      passingMarks: 6,
      isPublished: true,
      questions: {
        create: [
          {
            question: "What is JSX in React?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "JSX is a syntax extension that allows you to write HTML-like code in JavaScript.",
            options: {
              create: [
                { text: "A JavaScript library", isCorrect: false },
                { text: "A syntax extension for JavaScript", isCorrect: true },
                { text: "A CSS framework", isCorrect: false },
                { text: "A database query language", isCorrect: false },
              ],
            },
          },
          {
            question: "Which hook is used for managing state in functional components?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "useState is the primary hook for adding state to functional components.",
            options: {
              create: [
                { text: "useEffect", isCorrect: false },
                { text: "useState", isCorrect: true },
                { text: "useContext", isCorrect: false },
                { text: "useReducer", isCorrect: false },
              ],
            },
          },
          {
            question: "What is the purpose of useEffect hook?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "useEffect is used for side effects like data fetching, subscriptions, or DOM manipulation.",
            options: {
              create: [
                { text: "To create new state", isCorrect: false },
                { text: "To handle side effects", isCorrect: true },
                { text: "To pass props to children", isCorrect: false },
                { text: "To define component styles", isCorrect: false },
              ],
            },
          },
          {
            question: "Which are valid React hooks?",
            type: "MULTIPLE_CORRECT",
            marks: 2,
            explanation: "useState, useEffect, useContext, useMemo, useCallback, useRef, and useReducer are all built-in React hooks.",
            options: {
              create: [
                { text: "useState", isCorrect: true },
                { text: "useEffect", isCorrect: true },
                { text: "useMemo", isCorrect: true },
                { text: "useClass", isCorrect: false },
              ],
            },
          },
          {
            question: "What does the 'key' prop do in React lists?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Keys help React identify which items have changed, are added, or removed for efficient updates.",
            options: {
              create: [
                { text: "Styles the list items", isCorrect: false },
                { text: "Sorts the list", isCorrect: false },
                { text: "Helps React identify items for efficient updates", isCorrect: true },
                { text: "Filters the list", isCorrect: false },
              ],
            },
          },
          {
            question: "What is prop drilling in React?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "Prop drilling is passing props through multiple levels of components to reach a deeply nested child.",
            options: {
              create: [
                { text: "A method to optimize rendering", isCorrect: false },
                { text: "Passing props through many component levels", isCorrect: true },
                { text: "A debugging technique", isCorrect: false },
                { text: "A way to validate props", isCorrect: false },
              ],
            },
          },
          {
            question: "Which method is used to render a React component?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "In React 18+, createRoot().render() is used. The return statement in functional components defines what to render.",
            options: {
              create: [
                { text: "ReactDOM.render() or createRoot().render()", isCorrect: true },
                { text: "React.show()", isCorrect: false },
                { text: "component.display()", isCorrect: false },
                { text: "render.component()", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Created React quiz with questions");

  await prisma.quiz.create({
    data: {
      title: "Python Basics",
      description: "Test your Python programming fundamentals including data types, loops, and functions.",
      categoryId: categories[1].id,
      durationMinutes: 15,
      totalMarks: 10,
      passingMarks: 6,
      isPublished: true,
      questions: {
        create: [
          {
            question: "How do you create a list in Python?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Lists in Python are created using square brackets [].",
            options: {
              create: [
                { text: "list = (1, 2, 3)", isCorrect: false },
                { text: "list = [1, 2, 3]", isCorrect: true },
                { text: "list = {1, 2, 3}", isCorrect: false },
                { text: 'list = "1, 2, 3"', isCorrect: false },
              ],
            },
          },
          {
            question: "What is the output of: print(type([]))?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "An empty [] creates a list object in Python.",
            options: {
              create: [
                { text: "<class 'tuple'>", isCorrect: false },
                { text: "<class 'list'>", isCorrect: true },
                { text: "<class 'dict'>", isCorrect: false },
                { text: "<class 'set'>", isCorrect: false },
              ],
            },
          },
          {
            question: "Which keyword is used to define a function in Python?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "The 'def' keyword is used to define functions in Python.",
            options: {
              create: [
                { text: "function", isCorrect: false },
                { text: "func", isCorrect: false },
                { text: "def", isCorrect: true },
                { text: "define", isCorrect: false },
              ],
            },
          },
          {
            question: "Which data types are mutable in Python?",
            type: "MULTIPLE_CORRECT",
            marks: 2,
            explanation: "Lists, dictionaries, and sets are mutable. Strings, tuples, and integers are immutable.",
            options: {
              create: [
                { text: "List", isCorrect: true },
                { text: "Tuple", isCorrect: false },
                { text: "Dictionary", isCorrect: true },
                { text: "String", isCorrect: false },
              ],
            },
          },
          {
            question: "What does the 'self' parameter refer to in a Python class?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "self refers to the instance of the class being operated on.",
            options: {
              create: [
                { text: "The class itself", isCorrect: false },
                { text: "The instance of the class", isCorrect: true },
                { text: "The parent class", isCorrect: false },
                { text: "A global variable", isCorrect: false },
              ],
            },
          },
          {
            question: "How do you start a for loop in Python?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "Python uses 'for item in iterable:' syntax for loops.",
            options: {
              create: [
                { text: "for (i = 0; i < 10; i++)", isCorrect: false },
                { text: "for i in range(10):", isCorrect: true },
                { text: "foreach i in range(10)", isCorrect: false },
                { text: "loop i from 0 to 10", isCorrect: false },
              ],
            },
          },
          {
            question: "What is a Python decorator?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "Decorators are functions that modify the behavior of other functions or classes.",
            options: {
              create: [
                { text: "A way to add comments", isCorrect: false },
                { text: "A function that modifies another function", isCorrect: true },
                { text: "A type of variable", isCorrect: false },
                { text: "A loop structure", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Created Python quiz with questions");

  await prisma.quiz.create({
    data: {
      title: "General Knowledge",
      description: "Test your general knowledge across various topics.",
      categoryId: categories[3].id,
      durationMinutes: 10,
      totalMarks: 10,
      passingMarks: 6,
      isPublished: true,
      questions: {
        create: [
          {
            question: "What is the capital of France?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Paris is the capital and largest city of France.",
            options: {
              create: [
                { text: "London", isCorrect: false },
                { text: "Berlin", isCorrect: false },
                { text: "Paris", isCorrect: true },
                { text: "Madrid", isCorrect: false },
              ],
            },
          },
          {
            question: "Which planet is known as the Red Planet?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Mars appears red due to iron oxide (rust) on its surface.",
            options: {
              create: [
                { text: "Venus", isCorrect: false },
                { text: "Mars", isCorrect: true },
                { text: "Jupiter", isCorrect: false },
                { text: "Saturn", isCorrect: false },
              ],
            },
          },
          {
            question: "Who painted the Mona Lisa?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "Leonardo da Vinci painted the Mona Lisa between 1503-1519.",
            options: {
              create: [
                { text: "Vincent van Gogh", isCorrect: false },
                { text: "Pablo Picasso", isCorrect: false },
                { text: "Leonardo da Vinci", isCorrect: true },
                { text: "Michelangelo", isCorrect: false },
              ],
            },
          },
          {
            question: "What is the largest ocean on Earth?",
            type: "SINGLE_CORRECT",
            marks: 1,
            explanation: "The Pacific Ocean is the largest, covering about 63 million square miles.",
            options: {
              create: [
                { text: "Atlantic Ocean", isCorrect: false },
                { text: "Indian Ocean", isCorrect: false },
                { text: "Arctic Ocean", isCorrect: false },
                { text: "Pacific Ocean", isCorrect: true },
              ],
            },
          },
          {
            question: "Which countries are part of the United Kingdom?",
            type: "MULTIPLE_CORRECT",
            marks: 2,
            explanation: "The UK consists of England, Scotland, Wales, and Northern Ireland.",
            options: {
              create: [
                { text: "England", isCorrect: true },
                { text: "Scotland", isCorrect: true },
                { text: "Ireland", isCorrect: false },
                { text: "Wales", isCorrect: true },
              ],
            },
          },
          {
            question: "What is the chemical symbol for gold?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "Au comes from the Latin word 'aurum' meaning gold.",
            options: {
              create: [
                { text: "Go", isCorrect: false },
                { text: "Gd", isCorrect: false },
                { text: "Au", isCorrect: true },
                { text: "Ag", isCorrect: false },
              ],
            },
          },
          {
            question: "Which year did World War II end?",
            type: "SINGLE_CORRECT",
            marks: 2,
            explanation: "World War II ended in 1945 with the surrender of Germany and Japan.",
            options: {
              create: [
                { text: "1943", isCorrect: false },
                { text: "1944", isCorrect: false },
                { text: "1945", isCorrect: true },
                { text: "1946", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Created General Knowledge quiz with questions");

  // Create settings
  await prisma.settings.createMany({
    data: [
      {
        key: "site_name",
        value: "QuizApp",
      },
      {
        key: "payment_upi_id",
        value: "quizapp@upi",
      },
      {
        key: "payment_qr_url",
        value: "/images/payment-qr.png",
      },
      {
        key: "support_email",
        value: "support@quizapp.com",
      },
    ],
  });
  console.log("✅ Created settings");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test credentials:");
  console.log("   Admin: admin@quizapp.com / admin123");
  console.log("   User:  john@example.com / user123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
