import { errorAtom } from "@/lib/store";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useAtom(errorAtom);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        theme: "dark",
        autoClose: 5000,
        position: "top-center",
      });
      setTimeout(() => setError(undefined), 5000);
    }
  }, [error]);

  return (
    <>
      <ToastContainer />
      {children}
    </>
  );
}
