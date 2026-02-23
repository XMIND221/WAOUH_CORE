// filepath: d:\WAOUH_CORE\waouh_core_app\src\features\auth\hooks\useProfile.ts
import { useStableProfile } from "./useStableProfile";
type UseProfileOptions = { enabled?: boolean; userId?: string | null };
export function useProfile(options: UseProfileOptions = {}) {
  return useStableProfile(options);
}
