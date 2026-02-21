export function getSupabaseErrorMessage(error: unknown, fallback = "Erreur inconnue") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as any;
    return e.message || e.error_description || e.details || fallback;
  }
  return fallback;
}