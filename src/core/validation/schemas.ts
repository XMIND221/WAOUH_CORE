import { z } from "zod";
// Auth
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
});
export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
// Client
export const createClientSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["prospect", "lead", "client", "actif", "inactif"]),
  assigned_to: z.string().uuid().optional(),
});
// Project
export const createProjectSchema = z.object({
  name: z.string().min(3, "Minimum 3 caractères"),
  description: z.string().optional(),
  client_id: z.string().uuid("Client invalide"),
  status: z.enum(["active", "on_hold", "completed", "cancelled"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
// Task
export const createTaskSchema = z.object({
  title: z.string().min(3, "Minimum 3 caractères"),
  description: z.string().optional(),
  project_id: z.string().uuid("Projet invalide").optional(),
  assigned_to: z.string().uuid().optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  deadline: z.string().optional(),
});
// Invoice
export const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Client invalide"),
  deal_id: z.string().uuid().optional(),
  amount: z.number().positive("Montant invalide"),
  due_date: z.string().optional(),
});
// Deal
export const createDealSchema = z.object({
  client_id: z.string().uuid("Client invalide"),
  title: z.string().min(3, "Minimum 3 caractères"),
  amount: z.number().positive("Montant invalide"),
  stage: z.enum(["nouveau", "qualification", "proposition", "negociation", "gagne", "perdu"]),
  probability: z.number().min(0).max(100, "Entre 0 et 100"),
  expected_close: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
});
// Helper pour valider
export function validate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => issue.message);
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation échouée"] };
  }
}
