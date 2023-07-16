<script lang="ts">
import { ref, watch } from 'vue';
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

        watch(props.imageUrls, async (newValue: string[], _) => {
            for (const url of newValue) {
                await photopeaContext.pasteImageOnPhotopea(url, props.left, props.top);
            }
        });

        return {
            selectedIndex,
            async selectResultImage(imageURL: string, index: number) {
                await photopeaContext.pasteImageOnPhotopea(imageURL, props.left, props.top);
                selectedIndex.value = index;
            }
        };
    },
};
</script>

<template>
    <div class="image-grid">
        <div :class="{ 'grid-item': true, 'selected': index === selectedIndex }" v-for="(image, index) in imageUrls"
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


