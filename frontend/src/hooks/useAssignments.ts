'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAssignments } from '@/src/lib/api';
import type { Assignment } from '@/src/types/api';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignments();
      setAssignments(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('[useAssignments]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const loadAssignments = async () => {
    await fetch();
  };

  void loadAssignments();
}, [fetch]);

  return { assignments, loading, error, refetch: fetch };
}