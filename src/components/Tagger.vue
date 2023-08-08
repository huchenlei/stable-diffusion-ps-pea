<script lang="ts">
import { computed, ref } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { TagsOutlined, UploadOutlined } from '@ant-design/icons-vue';

export default {
    name: 'Tagger',
    props: {},
    components: {
        TagsOutlined,
        UploadOutlined,
    },
    emits: ['update:prompt', 'append:prompt'],
    setup(props, { emit }) {
        const visible = ref<boolean>(false);
        const context = useA1111ContextStore().taggerContext;
        const interrogatorOptions = computed(() => {
            return context.interrogators.map(name => {
                return {
                    label: name,
                    value: name,
                };
            });
        });
        const interrogator = ref<string>(
            interrogatorOptions.value.length > 0 ?
                interrogatorOptions.value[0].value : ''
        );

        const showDrawer = () => {
            visible.value = true;
        };

        const imageURL = ref<string>('');
        function beforeUploadImage(file: Blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageURL.value = e.target!.result! as string;
            };
            reader.readAsDataURL(file);
            // Return false to prevent the default upload behavior
            return false;
        }

        return {
            context,
            interrogator,
            interrogatorOptions,
            visible,
            showDrawer,
            imageURL,
            beforeUploadImage,
        };
    },
};
</script>

<template>
    <a-button type="primary" @click="showDrawer" :title="$t('gen.tagger')" :disabled="!context.initialized">
        <TagsOutlined />
    </a-button>

    <a-drawer v-model:visible="visible" title="Tagger" placement="right">
        <a-space direction="vertical" style="width: 100%;">
            <a-select v-model:value="interrogator" :options="interrogatorOptions" style="width: 100%;">
            </a-select>

            <a-upload list-type="picture" accept="image/*" :beforeUpload="beforeUploadImage" :max-count="1"
                class="image-upload">
                <!-- Disable item rendering -->
                <template #itemRender="{ file, actions }"></template>
                <div v-if="imageURL" class="image-item">
                    <a-image :src="imageURL" :preview="false"></a-image>
                </div>
                <div v-else class="image-item">
                    <UploadOutlined></UploadOutlined>
                    <div class="ant-upload-text">{{ $t('cnet.uploadImage') }}</div>
                </div>
            </a-upload>
        </a-space>
    </a-drawer>
</template>

<style>
.image-upload,
.image-upload>div,
.image-upload>div>span {
    width: 100%;
}

.image-item {
    width: 100%;
    /* width / height */
    aspect-ratio: 1 / 1;
    border: 3px solid #4b4b4b;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}</style>
