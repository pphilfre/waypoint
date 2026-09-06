import { useRef, useState } from "react";

/** Keep the entered values available when saving fails; prevent duplicate submits. */
export function useSubmission(onSubmit: (values: any) => Promise<unknown>) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (values: any) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save. Check your connection and try again.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return { submit, pending, error };
}
