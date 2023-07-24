import { type IHistoryItem } from '@/Core';

import { defineStore } from 'pinia';
import JSON5 from 'json5';

const MAX_HISTORY_LENGTH = 64;

export const useHistoryStore = defineStore('historyStore', {
  state: () => ({
    historyItems: JSON5.parse(localStorage.getItem('historyItems') || '[]') as IHistoryItem[],
  }),
  actions: {
    addHistoryItem(item: IHistoryItem) {
      this.historyItems.push(item);
      if (this.historyItems.length > MAX_HISTORY_LENGTH) {
        this.historyItems.shift(); // Remove the oldest history item
      }
      this.persistHistoryItems();
    },
    getHistoryItems() {
      return this.historyItems;
    },
    persistHistoryItems() {
      localStorage.setItem('historyItems', JSON5.stringify(this.historyItems));
    },
  },
});
