'use client'

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Department } from '@/types/department';
import { DepartmentForm } from './DepartmentForm';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DepartmentListProps {
  showInactive?: boolean;
  initialDepartments?: Department[];
}

export function DepartmentList({ showInactive = false, initialDepartments = [] }: DepartmentListProps) {
  const authContext = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>(undefined);
  const [hasFetched, setHasFetched] = useState(false); // Track if we've fetched data

  // Ensure departments is always an array
  const safeDepartments = Array.isArray(departments) ? departments : [];

  // Check auth state first
  if (!authContext.isAuthenticated || authContext.user?.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    // Create a safe copy of initial departments
    const safeInitialDepartments = Array.isArray(initialDepartments) 
      ? [...initialDepartments]
      : [];

    if (safeInitialDepartments.length > 0) {
      setDepartments(safeInitialDepartments);
      setLoading(false);
      return;
    }

    let isMounted = true; // Track component mount state

    // Only fetch if we haven't fetched before and we're not loading
    if (!hasFetched && !loading) {
      setHasFetched(true);
      const fetchDepartments = async () => {
        try {
          if (!isMounted) return; // Early return if component unmounted
          setLoading(true);
          setError(null);
          const response = await api.getDepartments(
            { includeInactive: showInactive },
            authContext
          );
          
          if (!isMounted) return; // Early return if component unmounted
          
          if (response.success && response.data) {
            const data = Array.isArray(response.data) 
              ? [...response.data]
              : [];
            setDepartments(data);
          } else {
            setError('Failed to load departments');
            setDepartments([]);
          }
        } catch (err) {
          console.error('Error fetching departments:', err);
          setError('Error loading departments');
          setDepartments([]);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchDepartments();
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to prevent multiple re-renders

  // Prevent multiple renders from auth context
  useEffect(() => {
    if (authContext.isAuthenticated && authContext.user?.role === 'admin') {
      if (!hasFetched) {
        setHasFetched(true);
      }
    }
  }, [authContext]);

  // Cleanup function for main effect
  useEffect(() => {
    let isMounted = true;

    // Only fetch if we haven't fetched before and we're not loading
    if (!hasFetched && !loading) {
      setHasFetched(true);
      const fetchDepartments = async () => {
        try {
          if (!isMounted) return;
          setLoading(true);
          setError(null);
          const response = await api.getDepartments(
            { includeInactive: showInactive },
            authContext
          );
          
          if (!isMounted) return;
          
          if (response.success && response.data) {
            const data = Array.isArray(response.data) 
              ? [...response.data]
              : [];
            setDepartments(data);
          } else {
            setError('Failed to load departments');
            setDepartments([]);
          }
        } catch (err) {
          console.error('Error fetching departments:', err);
          setError('Error loading departments');
          setDepartments([]);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchDepartments();
    }

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to prevent multiple re-renders

  const handleCreate = () => {
    setSelectedDepartment(null);
    setShowForm(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedDepartment(undefined);
    setShowForm(false);
  };

  const handleDelete = async (department: Department) => {
    if (!window.confirm(`Are you sure you want to delete department "${department.name}"?`)) {
      return;
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const getDepartmentStatus = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Departments</h2>
        <Button onClick={handleCreate}>
          Create Department
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeDepartments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell>{department.description}</TableCell>
                  <TableCell>{getDepartmentStatus(department.isActive)}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(department)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(department)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {showForm && (
        <DepartmentForm
          department={selectedDepartment}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
