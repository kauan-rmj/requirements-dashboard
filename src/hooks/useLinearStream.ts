'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectData } from '@/lib/types';

export interface StreamState {
  projects: ProjectData[];
  totalProjects: number | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
}

type StreamChunk =
  | { type: 'meta'; total: number; updatedAt: string }
  | { type: 'project'; data: ProjectData }
  | { type: 'error'; message: string };

export function useLinearStream(): StreamState & { refresh: () => void } {
  const [state, setState] = useState<StreamState>({
    projects: [],
    totalProjects: null,
    updatedAt: null,
    loading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const startStream = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // On refresh keep the current data on screen and swap it in once the new stream completes,
    // so the legend/bars don't rebuild from empty while projects arrive. Only the first load streams in progressively.
    const background = hasDataRef.current;
    const incoming: ProjectData[] = [];
    const sortProjects = (list: ProjectData[]) =>
      [...list].sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));

    if (background) {
      setState((s) => ({ ...s, loading: true, error: null }));
    } else {
      setState({ projects: [], totalProjects: null, updatedAt: null, loading: true, error: null });
    }

    try {
      const res = await fetch('/api/linear-stream', { signal: ac.signal });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as StreamChunk;

          if (chunk.type === 'meta') {
            if (background) {
              setState((s) => ({ ...s, updatedAt: chunk.updatedAt }));
            } else {
              setState((s) => ({ ...s, totalProjects: chunk.total, updatedAt: chunk.updatedAt }));
            }
          } else if (chunk.type === 'project') {
            incoming.push(chunk.data);
            if (!background) {
              setState((s) => ({ ...s, projects: sortProjects(incoming) }));
            }
          } else if (chunk.type === 'error') {
            throw new Error(chunk.message);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
      return;
    }

    hasDataRef.current = incoming.length > 0;
    setState((s) => ({
      ...s,
      projects: background ? sortProjects(incoming) : s.projects,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    void startStream();
    return () => {
      abortRef.current?.abort();
    };
  }, [startStream]);

  return { ...state, refresh: startStream };
}
