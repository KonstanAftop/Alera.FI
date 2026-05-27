import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchApi } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  nama: string;
  role: "personal" | "community";
  homeLngLat?: [number, number];
  homeAddress?: string;
  subscribedPosIds?: string[];
  telegramLinked?: boolean;
  activationCode?: string;
  elevation?: number;
  riskProfile?: string;
  distanceToRiver?: number;
  managedArea?: string;
}

interface ProfileApiResponse {
  status: string;
  data: {
    id: string;
    full_name: string;
    email: string;
    role: "personal" | "community";
    telegram_linked?: boolean;
    activation_code?: string;
    individual_profile?: {
      location_lat: number;
      location_lng: number;
      address?: string;
      elevation?: number;
      risk_profile?: string;
      distance_to_river?: number;
    };
    community_profile?: {
      community_name?: string;
      managed_area?: string;
      telegram_group_id?: string | null;
      telegram_group_title?: string | null;
      telegram_linked_at?: string | null;
    };
    subscribed_pos_ids?: string[];
  };
}

function resolveTelegramLinked(profile: ProfileApiResponse["data"]): boolean | undefined {
  if (profile.role === "community") {
    const groupId = profile.community_profile?.telegram_group_id;
    if (groupId) return true;
    if (profile.telegram_linked === false) return false;
    return profile.telegram_linked ?? undefined;
  }
  return profile.telegram_linked ?? undefined;
}

function mapProfileToUser(
  profile: ProfileApiResponse["data"],
  userId: string,
  sessionEmail?: string | null,
): UserProfile {
  const baseUser: UserProfile = {
    id: userId,
    email: profile.email || sessionEmail || "",
    nama: profile.full_name || sessionEmail?.split("@")[0] || "User",
    role: profile.role,
    activationCode: profile.activation_code || undefined,
    telegramLinked: resolveTelegramLinked(profile),
    subscribedPosIds: profile.subscribed_pos_ids || [],
  };

  if (profile.role === "personal" && profile.individual_profile) {
    const individual = profile.individual_profile;
    baseUser.homeLngLat = [individual.location_lng, individual.location_lat] as [number, number];
    baseUser.homeAddress = individual.address || undefined;
    baseUser.elevation = individual.elevation || undefined;
    baseUser.riskProfile = individual.risk_profile || undefined;
    baseUser.distanceToRiver = individual.distance_to_river || undefined;
  } else if (profile.role === "community" && profile.community_profile) {
    baseUser.managedArea = profile.community_profile.managed_area || undefined;
  }

  return baseUser;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) { setUser(null); setLoading(false); }
        return;
      }

      const userId = session.user.id;
      
      try {
        // Fetch profile from backend API
        const response = await fetchApi<ProfileApiResponse>(`/api/user/profile?user_id=${userId}`);
        
        if (response.status !== "success" || !response.data) {
          if (mounted) { setUser(null); setLoading(false); }
          return;
        }

        const baseUser = mapProfileToUser(response.data, userId, session.user.email);

        if (mounted) {
          setUser(baseUser);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        if (mounted) { setUser(null); setLoading(false); }
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (mounted) { setUser(null); setLoading(false); }
      } else {
        loadUser();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      return null;
    }
    const userId = session.user.id;
    try {
      const response = await fetchApi<ProfileApiResponse>(`/api/user/profile?user_id=${userId}`);
      if (response.status !== "success" || !response.data) {
        setUser(null);
        return null;
      }
      const baseUser = mapProfileToUser(response.data, userId, session.user.email);
      setUser(baseUser);
      return baseUser;
    } catch (err) {
      console.error("Error refreshing user profile:", err);
      setUser(null);
      return null;
    }
  }, []);

  return { user, loading, signOut, refreshUser };
}
