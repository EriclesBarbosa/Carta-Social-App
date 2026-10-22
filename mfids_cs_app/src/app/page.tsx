"use client";
import { useAuth } from "@/contexts/auth-context";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { hasUserType, idOrganizacao } = useAuth();
  
  const getOrganizationPath = () => {
    if (hasUserType("P")) {
      return `/dashboard/proprietarios/${idOrganizacao}`;
    } else if (hasUserType("G")) {
      return `/dashboard/gestores/${idOrganizacao}`;
    }
    return "/dashboard";
  };

  redirect(getOrganizationPath());
}