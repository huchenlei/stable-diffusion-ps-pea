async function fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
}

class TaggerContext {
    taggerURL: string = '';
    interrogators: string[] = [];
    initialized: boolean = false;

    public async initialize(baseURL: string) {
        this.taggerURL = `${baseURL}/tagger/v1`;
        const data = await fetchJSON(`${this.taggerURL}/interrogators`);
        this.interrogators = data.models;

        this.initialized = true;
    }

    get interrogateURL(): string {
        return `${this.taggerURL}/interrogate`;
    }
};

export {
    TaggerContext,
}