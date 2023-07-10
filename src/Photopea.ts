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
        const response = await fetch(`${import.meta.env.BASE_URL}/js/photopea.js`);
        this.context = await response.text();
    }

    // Post a message to photopea and receive the result.
    private postMessageToPhotopea(message: string) {
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

    public async invoke(funcName: string, ...args: any[]) {
        if (!this.context) {
            await this.initialize();
        }
        const funcCall = `${funcName}(${args.map(arg => JSON.stringify(arg)).join(',')});`;
        const message = (this.context + funcCall);
        console.debug(message);
        return this.postMessageToPhotopea(message);
    }
};

interface PhotopeaBoundItem {
    0: string;
    b: number;
};
type PhotopeaBound = [PhotopeaBoundItem, PhotopeaBoundItem, PhotopeaBoundItem, PhotopeaBoundItem];

const photopeaContext = new PhotopeaContext();
export {
    type PhotopeaBound,
    photopeaContext
};
