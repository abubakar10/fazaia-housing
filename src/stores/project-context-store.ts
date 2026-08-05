"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProjectContextState = {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  clear: () => void;
};

/** Client mirror of server project context — persisted for instant shell UX. */
export const useProjectContextStore = create<ProjectContextState>()(
  persist(
    (set) => ({
      projectId: null,
      setProjectId: (projectId) => set({ projectId }),
      clear: () => set({ projectId: null }),
    }),
    {
      name: "fh-project-context",
      partialize: (state) => ({ projectId: state.projectId }),
    },
  ),
);
