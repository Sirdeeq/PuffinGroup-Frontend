"use client"

import { DepartmentForm } from "@/components/DepartmentForm";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

export default function CreateDepartmentPage() {
  const authContext = useAuth();

  // Redirect if user is not authenticated
  if (!authContext.isAuthenticated) {
    redirect("/login");
  }

  // Redirect if user is not admin
  if (authContext.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-orange-600">Create New Department</h1>
        <DepartmentForm onSuccess={() => {
          redirect("/dashboard/departments");
        }} />
      </div>
    </div>
  );
}