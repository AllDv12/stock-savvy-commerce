
import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { userApi } from "@/services/api";

/**
 * Hook for uploading and updating a user's avatar/profile picture.
 * Returns [avatarUrl, uploading, handleAvatarUpload, setAvatarUrl]
 */
export default function useAvatarUpload(initialUrl: string = "") {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const storage = getStorage();
  const { toast } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const user = auth.currentUser;
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, or GIF).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Avatar image must be smaller than 5MB.",
      });
      return;
    }

    setUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      
      // Update the Firebase Auth user profile
      await updateProfile(user, { photoURL: url });
      
      // Update profile in our backend
      await userApi.updateProfile({ photo_url: url });
      
      setAvatarUrl(url);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
      return url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Avatar upload failed",
        description: error?.message || "Error uploading avatar.",
      });
    } finally {
      setUploading(false);
    }
  };

  return { avatarUrl, uploading, handleAvatarUpload, setAvatarUrl };
}
