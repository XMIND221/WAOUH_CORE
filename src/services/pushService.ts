import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export async function registerForPushNotifications(userId: string, companyId: string) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from("user_devices").upsert(
    {
      user_id: userId,
      company_id: companyId,
      push_token: token,
      platform: "expo",
    },
    { onConflict: "user_id,push_token" }
  );
  return token;
}
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { someData: "goes here" },
  };
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
