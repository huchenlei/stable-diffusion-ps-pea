<script lang="ts">
import { photopeaContext, type PhotopeaBound, boundWidth, boundHeight } from '@/Photopea';
import { computed, reactive, onMounted, ref, watch } from 'vue';
import ImagePicker from './ImagePicker.vue';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { resizeImage } from '@/ImageUtil';

interface ImageItem {
    imageURL: string;
    name: string;
};

export default {
    name: 'GenerationResultPicker',
    props: {
        imageURLs: {
            type: Array<string>,
            required: true,
        },
        bound: {
            type: Array<number>,
            required: false,
        },
        maskBlur: {
            type: Number,
            required: false,
        },
    },
    components: {
        ImagePicker,
        CloseOutlined,
        CheckOutlined,
    },
    emits: ['result-finalized'],
    setup(props, { emit }) {
        const resultImageItems = computed(() => {
            return props.imageURLs.map((url, index) => {
                return {
                    imageURL: url,
                    name: `result-${index}`,
                };
            });
        });
        const selectedResultImages: ImageItem[] = reactive([]);
        const selectedResultImageNames = computed(() => {
            return selectedResultImages.map(image => image.name);
        });

        const photopeaInProgress = ref<boolean>(false);
        async function switchResultImage(imageItem: ImageItem) {
            if (photopeaInProgress.value) return;
            photopeaInProgress.value = true;
            await photopeaContext.executeTask(async () => {
                await deselectResultImage();
                await selectResultImage(imageItem);
            });
            photopeaInProgress.value = false;

            if (!ctrlPressed.value) {
                selectedResultImages.length = 0;
            }
            selectedResultImages.push(imageItem);
        }

        // Thead unsafe. Need to be called within task.
        async function deselectResultImage() {
            // Remove ResultTempLayer (Deselect previous item).
            await photopeaContext.invoke('removeTopLevelLayer', 'ResultTempLayer');
        }
        // Thead unsafe. Need to be called within task.
        async function selectResultImage(imageItem: ImageItem, layerName: string = 'ResultTempLayer') {
            const bound = props.bound! as PhotopeaBound;
            await photopeaContext.pasteImageOnPhotopea(
                await resizeImage(imageItem.imageURL, boundWidth(bound), boundHeight(bound)),
                bound, layerName
            );
        }
        function finalizeSelection() {
            selectedResultImages.length = 0;
            emit('result-finalized');
        }
        async function pickSelectedResultImages() {
            if (photopeaInProgress.value) return;
            photopeaInProgress.value = true;
            await photopeaContext.executeTask(async () => {
                await deselectResultImage();
                console.log("sdp: Mask blur" + props.maskBlur);
                if (props.maskBlur) {
                    await photopeaContext.invoke('applyMaskBlur', props.maskBlur);
                }
                for (const image of selectedResultImages) {
                    await selectResultImage(image, /* layerName= */'ResultLayer');
                    await photopeaContext.invoke('cropSelectedRegion');
                }
                await photopeaContext.invoke('deselect');
            });
            photopeaInProgress.value = false;
            finalizeSelection();
        }

        async function discardResultImages() {
            if (photopeaInProgress.value) return;
            photopeaInProgress.value = true;
            await photopeaContext.executeTask(async () => {
                await deselectResultImage();
            });
            photopeaInProgress.value = false;
            finalizeSelection();
        }

        const ctrlPressed = ref(false);
        onMounted(() => {
            function onKeydown(e: KeyboardEvent) {
                if (e.key === 'Control') {
                    ctrlPressed.value = true;
                }
            }
            function onKeyup(e: KeyboardEvent) {
                if (e.key === 'Control') {
                    ctrlPressed.value = false;
                }
            }
            window.addEventListener('keydown', onKeydown);
            window.addEventListener('keyup', onKeyup);
        });

        watch(props.imageURLs, async (newValue, oldValue) => {
            if (newValue.length > 0) {
                const imageItem = resultImageItems.value[0];
                await photopeaContext.executeTask(async () => {
                    await selectResultImage(imageItem);
                });
                selectedResultImages.push(imageItem);
            }
        });

        return {
            resultImageItems,
            selectedResultImages,
            selectedResultImageNames,
            photopeaInProgress,

            switchResultImage,
            discardResultImages,
            pickSelectedResultImages,
        };
    },
};
</script>

<template>
    <a-spin :spinning="photopeaInProgress">
        <ImagePicker :images="resultImageItems" :selectedImages="selectedResultImageNames" @item-clicked="switchResultImage"
            :displayNames="false"></ImagePicker>
    </a-spin>
    <a-row v-if="resultImageItems.length > 0">
        <a-button :danger="true" class="discard-result" @click="discardResultImages">
            <CloseOutlined></CloseOutlined>
        </a-button>
        <a-button class="pick-result" @click="pickSelectedResultImages">
            <CheckOutlined></CheckOutlined>
        </a-button>
    </a-row>
</template>

<style scoped>
.pick-result,
.discard-result {
    width: 50%;
}
</style>

