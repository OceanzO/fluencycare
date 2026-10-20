"use client";

import { useMemo } from "react";
import { useSession } from "../auth/AuthContext";
import { getSupabaseBrowserClient } from "../supabase/client";
import { demoRepository } from "./demo-repository";
import type { Repository } from "./repository";
import { createSupabaseRepository } from "./supabase-repository";

export function useRepository(): Repository {
  const { mode } = useSession();
  return useMemo(() => {
    const supabase = getSupabaseBrowserClient();
    return mode === "supabase" && supabase ? createSupabaseRepository(supabase) : demoRepository;
  }, [mode]);
}
