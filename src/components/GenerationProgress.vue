<script lang="ts">
import { ref, watch } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import type { IProgress } from '@/Automatic1111';

export default {
    name: 'GenerationProgress',
    props: {
        active: {
            type: Boolean,
            required: true,
        },
    },
    emits: ['update:active'],
    setup(props, { emit }) {
        const context = useA1111ContextStore().a1111Context;
        const progress = ref(0);
        const eta = ref(0);

        function reset() {
            progress.value = 0;
            eta.value = 0;
        }

        function trackProgress() {
            return new Promise((resolve, reject) => {
                let started = false;

                const taskId = setInterval(async () => {
                    try {
                        const response = await fetch(`${context.apiURL}/progress`);
                        const p = await response.json() as IProgress;

                        if (!started && p.progress === 0)
                            return;

                        if (p.progress > 0) {
                            progress.value = p.progress;
                            eta.value = p.eta_relative;
                            started = true;
                        }

                        if (p.progress === 0 || !props.active) {
                            clearInterval(taskId);
                            reset();
                            resolve(true);
                        }
                    } catch (e) {
                        clearInterval(taskId);
                        reset();
                        reject(false);
                    }
                }, 200);
            });
        }

        watch(() => props.active, async (newValue, oldValue) => {
            if (!oldValue && newValue) {
                await trackProgress();
                emit('update:active', false);
            }
        });

        async function interrupt() {
            const response = await fetch(`${context.apiURL}/interrupt`, { method: 'POST' });
            const r = await response.json();
            console.debug(`Interrupt done: ${JSON.stringify(r)}`);
            emit('update:active', false);
        }

        async function skip() {
            const response = await fetch(`${context.apiURL}/skip`, { method: 'POST' });
            const r = await response.json();
            console.debug(`Skip done: ${JSON.stringify(r)}`);
        }

        return {
            progress,
            eta,
            skip,
            interrupt,
        };
    },
};
</script>

<template>
    <a-space class="modal-container" v-if="active">
        <a-progress type="circle" :percent="Math.floor(progress * 100)"></a-progress>
        <a-button :ghost="true">
            {{ (Math.abs(eta)).toFixed(0) }} seconds
        </a-button>
        <a-space>
            <a-button :danger="true" :ghost="true" @click="skip">{{ $t('gen.skip') }}</a-button>
            <a-button :danger="true" :ghost="true" @click="interrupt">{{ $t('gen.interrupt') }}</a-button>
        </a-space>
    </a-space>
</template>

<style scoped>
.modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.5);
    /* Dark semi-transparent background */
    z-index: 1000;
}
</style>


