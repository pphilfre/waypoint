import { useCallback, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function useOpenFromQuery(parameter = "new") {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useNavigate();
  const [open, setOpenState] = useState(false);
  useEffect(() => {
    if (["1", '"1"'].includes(new URLSearchParams(search).get(parameter) ?? ""))
      setOpenState(true);
  }, [parameter, search]);
  const setOpen = useCallback(
    (value: boolean) => {
      setOpenState(value);
      if (!value && new URLSearchParams(search).has(parameter)) {
        const next = Object.fromEntries(new URLSearchParams(search));
        delete next[parameter];
        void navigate({ to: ".", search: next as never, replace: true });
      }
    },
    [navigate, parameter, search],
  );
  return [open, setOpen] as const;
}
export function useRecordSelection<T extends string>() {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useNavigate();
  const [selectedId, setId] = useState<T | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(search).get("record") as T | null);
  }, [search]);
  const setSelectedId = useCallback(
    (id: T | null) => {
      setId(id);
      const next = Object.fromEntries(new URLSearchParams(search));
      if (id) {
        next.record = id;
        delete next.new;
      } else delete next.record;
      void navigate({ to: ".", search: next as never, replace: true });
    },
    [navigate, search],
  );
  return [selectedId, setSelectedId] as const;
}
