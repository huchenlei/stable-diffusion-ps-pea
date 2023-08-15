<script lang="ts">
import { photopeaContext, type PhotopeaBound, boundWidth, boundHeight } from '@/Photopea';
import { computed, reactive, onMounted, ref, watch } from 'vue';
import ImagePicker from './ImagePicker.vue';
import { CloseOutlined, CheckOutlined, RedoOutlined } from '@ant-design/icons-vue';
import { resizeImage } from '@/ImageUtil';
import type { IGeneratedImage } from '@/Automatic1111';

interface ImageItem extends IGeneratedImage {
    imageURL: string;
    name: string;
};

export default {
    name: 'GenerationResultPicker',
    props: {
        images: {
            type: Array<IGeneratedImage>,
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
        RedoOutlined,
    },
    emits: ['result-finalized', 'generate-more', 'generate-more-variants'],
    setup(props, { emit }) {
        const resultImageItems = computed(() => {
            return props.images.map((image, index) => {
                return {
                    imageURL: image.url,
                    name: `result-${index}`,
                    ...image,
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

        function generateMoreImages() {
            emit('generate-more');
        }

        function generateMoreVariants() {
            // The active image displayed on canvas.
            const displayedImage = selectedResultImages[selectedResultImages.length - 1];
            emit('generate-more-variants', displayedImage);
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

        watch(props.images, async (newValue, oldValue) => {
            if (newValue.length > 0) {
                const imageItem = resultImageItems.value[resultImageItems.value.length - 1];
                if (selectedResultImages.length === 0) {
                    await photopeaContext.executeTask(async () => {
                        await selectResultImage(imageItem);
                        selectedResultImages.push(imageItem);
                    });
                } else {
                    await switchResultImage(imageItem);
                }
            }
        });

        return {
            resultImageItems,
            selectedResultImageNames,
            photopeaInProgress,

            switchResultImage,
            discardResultImages,
            pickSelectedResultImages,
            generateMoreImages,
            generateMoreVariants,
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
        <a-button class="button" @click="generateMoreVariants" :title="$t('gen.generateMoreVariants')">
            <img src="/icons/dice.svg" alt="dice" style="width: 1em; height: 1em; margin-bottom: 4px;">
        </a-button>
        <a-button class="button" @click="generateMoreImages" :title="$t('gen.generateMore')">
            <RedoOutlined></RedoOutlined>
        </a-button>
        <a-button :danger="true" class="button" @click="discardResultImages">
            <CloseOutlined></CloseOutlined>
        </a-button>
        <a-button class="button" @click="pickSelectedResultImages">
            <CheckOutlined></CheckOutlined>
        </a-button>
    </a-row>
</template>

<style scoped>
button {
    width: 25%;
}
</style>

