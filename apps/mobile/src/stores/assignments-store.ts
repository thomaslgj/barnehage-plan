import { useSyncExternalStore } from 'react';

export interface AssignmentData {
  [key: string]: string | null; // key: "YYYY-MM-DD-dropoff" or "YYYY-MM-DD-pickup", value: user_id
}

let assignments: AssignmentData = {};
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function getAssignments(): AssignmentData {
  return assignments;
}

export function setAssignments(
  updater: AssignmentData | ((prev: AssignmentData) => AssignmentData),
): void {
  assignments =
    typeof updater === 'function' ? updater(assignments) : updater;
  emitChange();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Subscribe to the full assignments object. */
export function useAssignments(): AssignmentData {
  return useSyncExternalStore(subscribe, getAssignments);
}
