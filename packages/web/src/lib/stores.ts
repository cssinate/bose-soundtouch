import { writable } from "svelte/store";

/**
 * Global store for the currently selected speaker
 */
export const selectedSpeaker = writable<string | null>(null);
