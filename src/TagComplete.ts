import Fuse from 'fuse.js';
import Papa from 'papaparse';

interface Tag {
    tag: string;
    category: number;
    count: number;
    aliases: string[];
}

async function fetchCSV(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
}

async function parseTagCSV(csvText: string): Promise<Tag[]> {
    const results = Papa.parse(csvText, {
        header: false,
        dynamicTyping: true,
    });

    // Convert the parsed data to an array of Tag objects
    const tags: Tag[] = results.data.map((row: any) => ({
        tag: row[0],
        category: row[1],
        count: row[2],
        aliases: row[3] ? row[3].split(',') : [],
    }));
    return tags;
}

interface IFuseResult<T> {
    item: T;
};

interface IFuse<T> {
    search: (text: string, options: { limit: number } | undefined) => IFuseResult<T>[];
};

class TagCompleteManager {
    fuse: IFuse<Tag>;

    constructor(tags: Tag[]) {
        const options = {
            keys: ['name', 'alias'],
            threshold: 0.3,
            shouldSort: true,
        };
        this.fuse = new Fuse(tags, options);
    }

    public completeTag(text: string, limit: number = 10): Tag[] {
        const results = this.fuse.search(text, { limit });
        const matchedTags: Tag[] = results.map(result => result.item);
        return matchedTags;
    }
};


export {
    type Tag,
    TagCompleteManager,
    fetchCSV,
    parseTagCSV,
};