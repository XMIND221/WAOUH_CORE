import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
interface AttachmentUploaderProps {
  onUploadComplete: (url: string) => void;
}
export function AttachmentUploader({ onUploadComplete }: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const handleFileSelect = async () => {
    try {
      setIsUploading(true);
      // Pour le web, utiliser input file
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf,.doc,.docx";
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `attachments/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, file);
        if (uploadError) {
          alert("Erreur lors de l'upload: " + uploadError.message);
          return;
        }
        const { data } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(filePath);
        onUploadComplete(data.publicUrl);
        setIsUploading(false);
      };
      input.click();
    } catch (error) {
      alert("Erreur: " + error);
      setIsUploading(false);
    }
  };
  return (
    <Pressable onPress={handleFileSelect} style={styles.button} disabled={isUploading}>
      {isUploading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>📎 Joindre un fichier</Text>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { backgroundColor: "#6b7280", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: "#fff", fontSize: 14 },
});