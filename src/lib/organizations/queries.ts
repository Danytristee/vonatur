import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CurrentUserOrganization = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

function toOrganizationRole(role: string): CurrentUserOrganization["role"] {
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }

  throw new Error(`Unexpected organization role: ${role}`);
}

export async function getCurrentUserOrganizations(): Promise<CurrentUserOrganization[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // An absent session is the ordinary anonymous case, not a failure. Supabase
  // signals it with AuthSessionMissingError, so throwing here would turn every
  // logged-out request into a 500 instead of letting the caller redirect.
  if (userError && userError.name !== "AuthSessionMissingError") {
    throw new Error("Unable to verify the current Supabase user", {
      cause: userError,
    });
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load the current user's organizations", {
      cause: error,
    });
  }

  return data.flatMap((membership) => {
    const organization = Array.isArray(membership.organizations)
      ? membership.organizations[0]
      : membership.organizations;

    if (!organization) {
      return [];
    }

    return [
      {
        id: organization.id,
        name: organization.name,
        role: toOrganizationRole(membership.role),
      },
    ];
  });
}
