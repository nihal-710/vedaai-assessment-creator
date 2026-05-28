'use client';
import { useState, useEffect, useCallback } from 'react';
import { getJobByAssignmentId }              from '@/src/lib/api';
import type { GenerationJob }                from '@/src/types/api';

export function useGenerationJob(assignmentId: string) {
  const [job,     setJob]     = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!assignmentId || assignmentId === 'mock-assignment-id') {
      setLoading(false);
      return;
    }
    try {
      const data = await getJobByAssignmentId(assignmentId);
      setJob(data);
    } catch (err) {
      console.error('[useGenerationJob]', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
  const loadJob = async () => {
    await fetch();
  };

  void loadJob();
}, [fetch]);

  return { job, loading, refetch: fetch };
}