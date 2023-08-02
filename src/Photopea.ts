interface PromiseCallbacks {
    resolve: (result: any) => void;
    reject: (e: any) => void;
};

interface Task {
    taskId: number;
    taskFunc: () => any;
};

const MESSAGE_END_ACK = "done";
const MESSAGE_ERROR = "error";
class PhotopeaContext {
    photopeaWindow: Window;
    // The content is a JS file that defines many useful photopea operations.
    context: string;
    // Timeout for a photopea operation.
    timeout: number;
    // Global task id counter tracking the next task id.
    taskIdCounter: number = 0;
    // An queue of tasks. FIFO.
    taskQueue: Task[] = [];
    // The active task executing in Photopea at the moment.
    activeTask: number | null = null;
    // Add a map to store resolve functions for tasks
    taskCallbacks: { [id: number]: PromiseCallbacks } = {};

    constructor(timeout: number = 10) {
        this.photopeaWindow = window.parent;
        this.context = '';
        this.timeout = timeout;
    }

    async initialize() {
        const response = await fetch(`js/photopea.js`);
        this.context = (await response.text())
            .replace(/\/\/.*/g, '') // Stripe out all line comments.
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // Stripe out all block comments.
            .replace(/^\s*[\r\n]/gm, ''); // Remove empty new lines.
    }

    public queueTask(taskFunc: () => any): number {
        // Create a new task id
        const taskId = this.taskIdCounter;

        // Add the task to the queue
        this.taskQueue.push({ taskId, taskFunc });

        console.debug(`sdp: Queue task #${taskId} ${taskFunc}`);

        // If there's no active task, start executing tasks
        if (this.activeTask === null) {
            this.executeNextTask();
        }

        // Increment the task id counter
        this.taskIdCounter++;

        // Return the task id so the caller can track the task if necessary
        return taskId;
    }

    public invokeAsTask(funcName: string, ...args: any[]): Promise<any> {
        return this.executeTask(() => {
            return this.invoke(funcName, ...args);
        });
    }

    // Execute the given task func atomically, i.e. during execution, no other
    // tasks can execute at the same time. Thread unsafe functions wrapped by
    // executeTask become thread-safe.
    public executeTask(taskFunc: () => any): Promise<any> {
        // Queue the task and get its id
        const taskId = this.queueTask(taskFunc);

        // Return a Promise that resolves when the task finishes
        return new Promise((resolve, reject) => {
            this.taskCallbacks[taskId] = { resolve, reject };
        });
    }

    private async executeNextTask() {
        // If there's no task in the queue, set the active task to null and return
        if (this.taskQueue.length === 0) {
            this.activeTask = null;
            return;
        }

        // Get the next task from the queue
        const { taskId, taskFunc } = this.taskQueue.shift()!;

        // Set the active task id
        this.activeTask = taskId;

        // Execute the task
        let result;
        let error;
        try {
            console.debug(`sdp: Execute task #${taskId}`);
            result = await taskFunc();
        } catch (e) {
            error = e;
        } finally {
            console.debug(`sdp: Done task #${taskId}`);
            // The task is done, execute the next task
            this.executeNextTask();

            // Resolve the Promise for this task
            if (this.taskCallbacks[taskId]) {
                const { resolve, reject } = this.taskCallbacks[taskId];
                if (error !== undefined) {
                    console.debug(`sdp: Reject task #${taskId} ${error}`);
                    reject(error);
                } else {
                    console.debug(`sdp: Resolve task #${taskId} ${result}`);
                    resolve(result);
                }
                delete this.taskCallbacks[taskId];
            }
        }
    }

    // Post a message to photopea and receive the result.
    private postMessageToPhotopea(message: string): Promise<any> {
        if (window === window.top) {
            throw Error("Not running in Photopea environment!");
        }

        return new Promise((resolve, reject) => {
            const responseDataPieces: any[] = [];
            let hasError = false;
            const photopeaMessageHandle = (event: MessageEvent) => {
                if (event.source !== this.photopeaWindow) {
                    return;
                }
                // Filter out the ping messages
                if (typeof event.data === 'string' && event.data.includes('MSFAPI#')) {
                    console.debug('sdp: Ignored ping message');
                    return;
                }
                // Ignore "done" when no data has been received. The "done" can come from
                // MSFAPI ping.
                if (event.data === MESSAGE_END_ACK && responseDataPieces.length === 0) {
                    console.debug('sdp: no data on receiving done');
                    return;
                }
                console.debug(`sdp: Receive frame message ${event.data}`);
                if (event.data === MESSAGE_END_ACK) {
                    window.removeEventListener("message", photopeaMessageHandle);
                    if (hasError) {
                        reject('Photopea Error.');
                    } else {
                        resolve(responseDataPieces.length === 1 ? responseDataPieces[0] : responseDataPieces);
                    }
                } else if (event.data === MESSAGE_ERROR) {
                    responseDataPieces.push(event.data);
                    hasError = true;
                } else {
                    responseDataPieces.push(event.data);
                }
            };

            window.addEventListener("message", photopeaMessageHandle);
            setTimeout(() => reject("Photopea message timeout"), this.timeout * 1000);
            this.photopeaWindow.postMessage(message, "*");
        });
    }

    // Thread unsafe invoke. Need be called within a task.
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

    // Thread unsafe. Need be called within a task.
    public async pasteImageOnPhotopea(
        imageURL: string, bound: PhotopeaBound, scaleRatio: number,
        layerName: string = 'image'
    ) {
        const layerCount = Number(await this.invoke('pasteImageAsNewLayer', imageURL));
        console.debug(`sdp: Adding new layer. Num of top layers: ${layerCount}`);

        return new Promise((resolve, reject) => {
            let invokeInProgress = false;
            const waitTranslate = setInterval(async () => {
                try {
                    if (invokeInProgress) return;
                    invokeInProgress = true;
                    const status = await this.invoke(
                        'translateIfNewLayerAdded', layerCount, bound, scaleRatio, layerName);
                    if (status === 'success') {
                        console.debug(`sdp: New layer added. Done post process`);
                        clearInterval(waitTranslate);
                        resolve(true);
                        return;
                    }
                    console.debug(`sdp: New layer not fully added. Continue waiting.`);
                } catch (e) {
                    clearInterval(waitTranslate);
                    reject(e);
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
