<script lang="ts">

interface ImageItem {
    imageURL: string;
    name: string;
};

export default {
    name: 'ImagePicker',
    props: {
        images: {
            type: Array<ImageItem>,
            default: [],
        },
        selectedImages: {
            type: Array<string>,
            default: [],
        },
    },
    emits: ['item-clicked'],
    setup(props, { emit }) {
        return {
            onItemClicked(item: ImageItem) {
                if (!props.selectedImages.includes(item.name))
                    emit('item-clicked', item);
            },
        };
    },
};
</script>

<template>
    <div class="modal">
        <div class="image-grid modal-content">
            <div :class="{ 'grid-item': true, 'selected': $props.selectedImages!.includes(item.name) }"
                v-for="(item, index) in $props.images" :key="index" @click="onItemClicked(item)">
                <a-image :src="item.imageURL" fallback="image_alt.png" :preview="false" />
                <div class="actions">
                    <span class="name">{{ item.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.selected {
    border: 4px solid #88a950 !important;
}

.modal {
    position: fixed;
    /* Stay in place */
    z-index: 1;
    /* Sit on top */
    left: 0;
    top: 0;
    width: 100%;
    /* Full width */
    height: 100%;
    /* Full height */
    overflow: auto;
    /* Enable scroll if needed */
    background-color: rgb(0, 0, 0);
    /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4);
    /* Black w/ opacity */
}

.modal-content {
    position: relative;
    background-color: rgb(0, 0, 0);
    /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4);
    /* Black w/ opacity */
    margin: 5vh auto;
    padding: 20px;
    border: 1px solid #888;
    width: 90%;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    grid-gap: 8px;
    overflow: unset;
}

.grid-item {
    overflow: hidden;
    background-size: cover;
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    position: relative;

    border: 1px solid rgb(45, 45, 45);
    border-radius: 3px;
    outline: none;
    transition: box-shadow 200ms cubic-bezier(0.215, 0.61, 0.355, 1) 0s, scale 400ms cubic-bezier(0.215, 0.61, 0.355, 1) 0s;
    margin: 0px;
}

.grid-item:hover {
    border-color: rgb(238, 238, 238);
    border-width: 1px;
    box-shadow: rgb(238, 238, 238) 0px 0px 0px 1px;
}

.grid-item img {
    position: absolute;
    object-fit: cover;
    width: 100%;
    height: 100%;
}

.actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 0.25em 0.25em rgba(0, 0, 0, 0.5);
    text-shadow: 0 0 0.2em black;
}

.actions * {
    color: white;
}

.actions .name {
    font-weight: bold;
    line-break: anywhere;
    overflow: hidden;
    display: block;
    text-overflow: ellipsis;
    text-shadow: rgba(0, 0, 0, 0.9) 0px 1px 1px;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.8), transparent);
    white-space: nowrap;
}

.grid-item:hover .actions .name {
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
}
</style>


