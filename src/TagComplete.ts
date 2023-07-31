import Fuse from 'fuse.js';
import _ from 'lodash';
import Papa from 'papaparse';

enum TagSource {
    kDanbooru,
    kE621,
};

interface Tag {
    name: string;
    category: number;
    count: number;
    aliases: string[];
    source: TagSource;
}

async function fetchCSV(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
}

function parseTagCSV(csvText: string, tagSource: TagSource): Tag[] {
    const results = Papa.parse(csvText, {
        header: false,
        dynamicTyping: false,
    });

    // Convert the parsed data to an array of Tag objects
    const tags: Tag[] = results.data.map((row: any) => ({
        name: row[0],
        category: parseInt(row[1], 10),
        count: parseInt(row[2], 10),
        aliases: row[3] && _.isString(row[3]) ? row[3].split(',') : [],
        source: tagSource,
    }));
    return tags;
}

interface IFuseResult<T> {
    item: T;
};

interface IFuse<T> {
    search: (text: string, options: { limit: number } | undefined) => IFuseResult<T>[];
};

class TrieNode<T> {
    children: { [key: string]: TrieNode<T> };
    isEndOfWord: boolean;
    leaf: T | null;

    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.leaf = null;
    }
}

class Trie<T> {
    root: TrieNode<T>;

    constructor() {
        this.root = new TrieNode<T>();
    }

    // Insert a word into the Trie
    insert(word: string, leaf: T): void {
        let currentNode = this.root;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            let node = currentNode.children[ch];
            if (!node) {
                node = new TrieNode<T>();
                currentNode.children[ch] = node;
            }
            currentNode = node;
        }
        currentNode.isEndOfWord = true;
        currentNode.leaf = leaf;
    }

    // Perform a search starting with a given prefix
    search(prefix: string): [string, T][] {
        let currentNode = this.root;
        for (let i = 0; i < prefix.length; i++) {
            const ch = prefix[i];
            const node = currentNode.children[ch];
            if (!node) {
                return [];
            }
            currentNode = node;
        }
        return this._getAllWordsFromNode(prefix, currentNode);
    }

    // Helper method to return all words that start with a given prefix
    private _getAllWordsFromNode(prefix: string, node: TrieNode<T>): [string, T][] {
        const words: [string, T][] = [];
        if (node.isEndOfWord) {
            words.push([prefix, node.leaf!]);
        }
        for (let ch in node.children) {
            const childNode = node.children[ch];
            words.push(...this._getAllWordsFromNode(prefix + ch, childNode));
        }
        return words;
    }
}

// Tag complete using Fuse.js. Too slow to be practical.
class FuzzyTagCompleteManager {
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

class TagCompleteManager {
    trie: Trie<Tag>;

    constructor(tags: Tag[]) {
        this.trie = new Trie();
        for (const tag of tags) {
            this.trie.insert(tag.name, tag);
            for (const alias of tag.aliases) {
                this.trie.insert(alias, tag);
            }
        }
    }

    public completeTag(text: string, limit: number = 10): [string, Tag][] {
        const results = this.trie.search(text).sort(([_1, t1], [_2, t2]) => t2.count - t1.count);
        return _.take(results, limit);
    }
};


export {
    type Tag,
    TagSource,
    TagCompleteManager,
    fetchCSV,
    parseTagCSV,
};