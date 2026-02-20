import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
interface PinState {
  isPinEnabled: boolean;
  isPinLocked: boolean;
  pinHash: string | null;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};
export const usePinStore = create<PinState>((set, get) => ({
  isPinEnabled: false,
  isPinLocked: false,
  pinHash: null,
  enablePin: async (pin: string) => {
    const hash = await hashPin(pin);
    await AsyncStorage.setItem("pin_hash", hash);
    await AsyncStorage.setItem("pin_enabled", "true");
    set({ isPinEnabled: true, pinHash: hash });
  },
  disablePin: async () => {
    await AsyncStorage.removeItem("pin_hash");
    await AsyncStorage.removeItem("pin_enabled");
    set({ isPinEnabled: false, pinHash: null, isPinLocked: false });
  },
  verifyPin: async (pin: string) => {
    const { pinHash } = get();
    if (!pinHash) return false;
    const hash = await hashPin(pin);
    const isValid = hash === pinHash;
    if (isValid) {
      set({ isPinLocked: false });
    }
    return isValid;
  },
  lockApp: () => set({ isPinLocked: true }),
  unlockApp: () => set({ isPinLocked: false }),
}));
// Charger l'état du PIN au démarrage
(async () => {
  const pinEnabled = await AsyncStorage.getItem("pin_enabled");
  const pinHash = await AsyncStorage.getItem("pin_hash");
  if (pinEnabled === "true" && pinHash) {
    usePinStore.setState({ isPinEnabled: true, pinHash, isPinLocked: true });
  }
})();