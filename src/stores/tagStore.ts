import { type Tag, TagCompleteManager, fetchCSV, parseTagCSV, TagSource } from '@/TagComplete';
import { defineStore } from 'pinia';

export const useTagStore = defineStore('tags', {
    state: () => ({
        tags: [] as Tag[],
        tagCompleteManager: {} as TagCompleteManager,
    }),

    actions: {
        async initStore() {
            const csvURLs = [
                'tags/danbooru.csv',
                'tags/e621.csv',
            ];

            const [danbooruData, e621Data] = await Promise.all(csvURLs.map(csvURL => fetchCSV(csvURL)));
            this.tags = parseTagCSV(danbooruData, TagSource.kDanbooru)
                .concat(parseTagCSV(e621Data, TagSource.kE621));
            this.tagCompleteManager = new TagCompleteManager(this.tags);
        }
    },
});