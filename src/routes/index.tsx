import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Coffee } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { loading, session } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Coffee className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }
  return <Navigate to={session ? "/dashboard" : "/login"} />;
}
