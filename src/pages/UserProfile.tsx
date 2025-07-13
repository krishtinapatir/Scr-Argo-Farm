import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

const UserProfile: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  // Fetch profile info
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Local state for editing
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // When profile loads, set editData only if not editing
  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zip_code: profile.zip_code || "",
      });
    }
  }, [profile, isEditing]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (newData: typeof editData) => {
      const { error } = await supabase
        .from("profiles")
        .update(newData)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Profile updated", description: "Your info was saved." });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    },
  });

  const isUnchanged =
    editData.name === (profile?.name || "") &&
    editData.phone === (profile?.phone || "") &&
    editData.address === (profile?.address || "") &&
    editData.city === (profile?.city || "") &&
    editData.state === (profile?.state || "") &&
    editData.zip_code === (profile?.zip_code || "");

  if (userLoading || profileLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your profile.</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mt-16 px-4 md:px-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Your Profile</h1>
        <div className="bg-white rounded-xl shadow p-6 md:p-8 max-w-2xl">
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              updateProfile.mutate(editData);
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={profile?.email || user.email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={editData.name}
                onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                placeholder="Your name"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={editData.phone}
                onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                placeholder="Your phone number"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={editData.address}
                onChange={e => setEditData(d => ({ ...d, address: e.target.value }))}
                placeholder="Street address"
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input
                  value={editData.city}
                  onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                  placeholder="City"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Input
                  value={editData.state}
                  onChange={e => setEditData(d => ({ ...d, state: e.target.value }))}
                  placeholder="State"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zip Code</label>
              <Input
                value={editData.zip_code}
                onChange={e => setEditData(d => ({ ...d, zip_code: e.target.value }))}
                placeholder="Zip code"
                disabled={!isEditing}
              />
            </div>
            {!isEditing ? (
              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Update
                </Button>
                <Button type="button" variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={updateProfile.isPending || isUnchanged}>
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      name: profile.name || "",
                      phone: profile.phone || "",
                      address: profile.address || "",
                      city: profile.city || "",
                      state: profile.state || "",
                      zip_code: profile.zip_code || "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;