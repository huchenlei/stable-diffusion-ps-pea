const MESSAGE_END_ACK = "done";
class PhotopeaContext {
    photopeaWindow: Window;
    // The content is a JS file that defines many useful photopea operations.
    context: string;

    constructor() {
        this.photopeaWindow = window.parent;
        this.context = '';
    }

    async initialize() {
        const response = await fetch(`js/photopea.js`);
        this.context = (await response.text())
            .replace(/\/\/.*/g, '') // Stripe out all line comments.
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // Stripe out all block comments.
            .replace(/^\s*[\r\n]/gm, ''); // Remove empty new lines.
    }

    // Post a message to photopea and receive the result.
    private postMessageToPhotopea(message: string): Promise<any> {
        if (window === window.top) {
            throw Error("Not running in Photopea environment!");
        }

        return new Promise((resolve, reject) => {
            const responseDataPieces: any[] = [];
            function photopeaMessageHandle(event: MessageEvent) {
                if (event.data == MESSAGE_END_ACK) {
                    window.removeEventListener("message", photopeaMessageHandle);
                    resolve(responseDataPieces.length === 1 ? responseDataPieces[0] : responseDataPieces);
                } else if (!event.data) {
                    reject('Photopea Error.');
                } else {
                    responseDataPieces.push(event.data);
                }
            };

            window.addEventListener("message", photopeaMessageHandle);
            // Timeout after 5s.
            setTimeout(() => reject("Photopea message timeout"), 5 * 1000);
            this.photopeaWindow.postMessage(message, "*");
        });
    }

    public async invoke(funcName: string, ...args: any[]): Promise<any> {
        if (!this.context) {
            await this.initialize();
        }
        const funcCall = `${funcName}(${args.map(arg => JSON.stringify(arg)).join(',')});`;
        const message = (this.context + funcCall);
        console.debug(funcCall);
        try {
            return await this.postMessageToPhotopea(message);
        } catch (e) {
            throw `Failed to invoke ${funcName}. ${e}.`;
        }
    }

    public async pasteImageOnPhotopea(imageURL: string, left: number, top: number, width: number, height: number) {
        const layerCount = await this.invoke('pasteImageAsNewLayer', imageURL) as number;

        return new Promise((resolve) => {
            const waitTranslate = setInterval(async () => {
                const status = await this.invoke(
                    'translateIfNewLayerAdded', layerCount, left, top, width, height);
                if (status === 'success') {
                    clearInterval(waitTranslate);
                    resolve(true);
                }
            }, 50);
        });
    }
};

type PhotopeaBound = [number, number, number, number];

const photopeaContext = new PhotopeaContext();
export {
    type PhotopeaBound,
    photopeaContext
};
