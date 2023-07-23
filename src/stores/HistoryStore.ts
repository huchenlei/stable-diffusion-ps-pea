import type { IHistoryItem } from '@/Core';
import { defineStore } from 'pinia';

export const useHistoryStore = defineStore('HistoryStore', {
  state: () => (Array<IHistoryItem>()),
});