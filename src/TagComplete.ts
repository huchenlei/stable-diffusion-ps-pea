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
        aliases: row[3] ? row[3].split(',') : [],
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

interface WithPriority {
    priority: number;
}

class PriorityQueue<T extends WithPriority> {
    private _items: T[];
    private _limit: number;

    constructor(limit: number) {
        this._items = [];
        this._limit = limit;
    }

    enqueue(item: T) {
        if (this._items.length < this._limit) {
            this._items.push(item);
            this._items.sort((a, b) => b.priority - a.priority);
        } else if (item.priority > this._items[this._items.length - 1].priority) {
            this._items.pop();
            this._items.push(item);
            this._items.sort((a, b) => b.priority - a.priority);
        }
    }

    getItems(): T[] {
        return this._items;
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
    search(prefix: string, limit: number, getPriority: (t: T) => number): [string, T][] {
        let currentNode = this.root;
        for (let i = 0; i < prefix.length; i++) {
            const ch = prefix[i];
            const node = currentNode.children[ch];
            if (!node) {
                return [];
            }
            currentNode = node;
        }
        let queue = new PriorityQueue<{ priority: number, value: [string, T] }>(limit);
        this._getAllWordsFromNode(prefix, currentNode, queue, getPriority);
        return queue.getItems().map(item => item.value);
    }

    // Helper method to return all words that start with a given prefix
    private _getAllWordsFromNode(
        prefix: string, node: TrieNode<T>,
        queue: PriorityQueue<{ priority: number, value: [string, T] }>,
        getPriority: (t: T) => number
    ) {
        if (node.isEndOfWord) {
            queue.enqueue({
                priority: getPriority(node.leaf!),
                value: [prefix, node.leaf!],
            });
        }
        for (let ch in node.children) {
            const childNode = node.children[ch];
            this._getAllWordsFromNode(prefix + ch, childNode, queue, getPriority);
        }
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
        return this.trie.search(text, limit, tag => tag.count);
    }
};


export {
    type Tag,
    TagSource,
    TagCompleteManager,
    FuzzyTagCompleteManager,
    fetchCSV,
    parseTagCSV,
};