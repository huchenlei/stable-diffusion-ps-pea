interface ISampler {
    name: string;
    aliases: string[];
    options: Record<string, any>;
};

interface IStableDiffusionModel {
    filename: string;
    hash: string;
    model_name: string;
    sha256: string;
    title: string;
};

interface ILoRA {
    alias: string;
    metadata: Record<string, any>;
    name: string;
    path: string;
};

interface IUpscaler {
    name: string;
    model_name: string | null;
    model_path: string | null;
    model_url: string | null;
    scale: number;
};

interface IStableDiffusionVAE {
    filename: string;
    model_name: string;
};

interface IEmbedding {
    sd_checkpoint: string;
    sd_checkpoint_name: string;
    shape: number;
    step: number;
    vector: number;
};

interface IEmbeddings {
    loaded: Record<string, IEmbedding>;
    skipped: Record<string, IEmbedding>;
}

interface IHypernetwork {
    name: string;
    path: string;
};

async function fetchJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
}

class A1111Context {
    baseURL: string = '';

    samplers: ISampler[] = [];
    upscalers: IUpscaler[] = [];
    embeddings: IEmbeddings | undefined;
    hypernetworks: IHypernetwork[] = [];
    sdModels: IStableDiffusionModel[] = [];
    sdVAEs: IStableDiffusionVAE[] = [];
    loras: ILoRA[] = [];

    public async initialize(baseURL: string): Promise<boolean> {
        this.baseURL = baseURL;
        const fetchPromises = [
            fetchJSON(`${this.apiURL}/samplers`),
            fetchJSON(`${this.apiURL}/sd-models`),
            fetchJSON(`${this.apiURL}/loras`),
            fetchJSON(`${this.apiURL}/upscalers`),
            fetchJSON(`${this.apiURL}/sd-vae`),
            fetchJSON(`${this.apiURL}/embeddings`),
            fetchJSON(`${this.apiURL}/hypernetworks`)
        ];

        try {
            const [
                samplers,
                sdModels,
                loras,
                upscalers,
                sdVAEs,
                embeddings,
                hypernetworks
            ] = await Promise.all(fetchPromises);

            this.samplers = samplers as ISampler[];
            this.sdModels = sdModels as IStableDiffusionModel[];
            this.loras = loras as ILoRA[];
            this.upscalers = upscalers as IUpscaler[];
            this.sdVAEs = sdVAEs as IStableDiffusionVAE[];
            this.embeddings = embeddings as IEmbeddings;
            this.hypernetworks = hypernetworks as IHypernetwork[];
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    get apiURL(): string {
        return `${this.baseURL}/sdapi/v1`;
    }
};

export {
    A1111Context,
    type ISampler,
};
