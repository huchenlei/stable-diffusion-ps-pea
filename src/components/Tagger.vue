<script lang="ts">
import { computed, ref, watch } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { TagsOutlined, UploadOutlined } from '@ant-design/icons-vue';
import SliderGroup from './SliderGroup.vue';
import { message } from 'ant-design-vue';

export default {
    name: 'Tagger',
    components: {
        TagsOutlined,
        UploadOutlined,
        SliderGroup,
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
        const imageURL = ref<string>('');
        const interrogator = ref<string>(
            interrogatorOptions.value.length > 0 ?
                interrogatorOptions.value[0].value : ''
        );
        const threshold = ref<number>(0.35);
        const tags = ref<Record<string, number>>({});
        const loading = ref<boolean>(false);

        const sortedTags = computed(() => {
            const entries = Object.entries(tags.value);
            entries.sort((a, b) => b[1] - a[1]);
            return entries.filter(([tag, weight]) => weight >= threshold.value);
        });

        const prompt = computed(() => {
            return sortedTags.value.map(([tag, weight]) => tag).join(', ');
        });

        const showDrawer = () => {
            visible.value = true;
        };

        function beforeUploadImage(file: Blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageURL.value = e.target!.result! as string;
            };
            reader.readAsDataURL(file);
            // Return false to prevent the default upload behavior
            return false;
        }

        watch(imageURL, async function (newValue: string, oldValue: string) {
            loading.value = true;
            try {
                const res = await fetch(context.interrogateURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: newValue,
                        model: interrogator.value,
                        threshold: threshold.value,
                    }),
                });
                const data = await res.json();

                if (res.ok) {
                    tags.value = data.caption;
                } else {
                    message.error(data.detail);
                }
            } finally {
                loading.value = false;
            }
        });

        function updatePrompt() {
            emit('update:prompt', prompt.value);
            message.info('Prompt Updated', 1);
            visible.value = false;
        }

        function appendPrompt() {
            emit('append:prompt', prompt.value);
            message.info('Prompt Updated', 1);
            visible.value = false;
        }

        return {
            context,
            interrogator,
            interrogatorOptions,
            visible,
            showDrawer,
            imageURL,
            threshold,
            beforeUploadImage,
            sortedTags,
            updatePrompt,
            appendPrompt,
            loading,
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
            <SliderGroup v-model:value="threshold" :min="0" :max="1" :label="$t('threshold')" :step="0.01"></SliderGroup>
            <a-spin :spinning="loading">
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
            </a-spin>
            <a-space v-show="sortedTags.length > 0">
                <a-button @click="updatePrompt">{{ $t('tagger.overwritePrompt') }}</a-button>
                <a-button @click="appendPrompt">{{ $t('tagger.appendPrompt') }}</a-button>
            </a-space>
            <div>
                <a-tag v-for="[tag, weight] in sortedTags">{{ tag }}: {{ weight.toFixed(2) }}</a-tag>
            </div>
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
}
</style>
