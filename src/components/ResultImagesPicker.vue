<script lang="ts">
import { ref } from 'vue';
import { photopeaContext } from '../Photopea';

export default {
    name: 'ResultImagesPicker',
    props: {
        imageUrls: {
            type: Array<string>,
            required: true,
        },
        left: {
            type: Number,
            required: true,
        },
        top: {
            type: Number,
            required: true,
        },
    },
    setup(props) {
        const selectedIndex = ref(0);

        async function pasteImageOnPhotopea(imageURL: string) {
            const layerCount = await photopeaContext.invoke('pasteImageAsNewLayer', imageURL) as number;

            return new Promise((resolve) => {
                const waitTranslate = setInterval(async () => {
                    const status = await photopeaContext.invoke(
                        'translateIfNewLayerAdded', layerCount, props.left, props.top);
                    if (status === 'success') {
                        clearInterval(waitTranslate);
                        resolve(true);
                    }
                }, 200);
            });
        }
        pasteImageOnPhotopea(props.imageURLs[selectedIndex.value]);

        return {
            selectedIndex,
            async selectResultImage(imageURL: string, index: number) {
                await pasteImageOnPhotopea(imageURL);
                selectedIndex.value = index;
            }
        };
    },
};
</script>

<template>
    <div class="image-grid">
        <div :class="{ 'grid-item': true, 'selected': index === selectedIndex }" v-for="(image, index) in imageURLs"
            :key="index" @click="selectResultImage(image, index)">
            <a-image :src="image" :preview="false" />
        </div>
    </div>
</template>

<style scoped>
.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    grid-gap: 10px;
}

.grid-item {
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    position: relative;
}

.grid-item img {
    position: absolute;
    object-fit: cover;
    width: 100%;
    height: 100%;
}

.selected {
    border: 3px solid #485681;
}
</style>


