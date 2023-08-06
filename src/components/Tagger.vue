<script lang="ts">
import { computed, ref } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { TagsOutlined } from '@ant-design/icons-vue';
import ImagePicker from './ImagePicker.vue';

export default {
    name: 'Tagger',
    props: {},
    components: {
        TagsOutlined,
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

        function beforeUplaodImage() {
            
        }

        return {
            context,
            interrogator,
            interrogatorOptions,
            visible,
            showDrawer,
            beforeUplaodImage,
        };
    },
};
</script>

<template>
    <a-button type="primary" @click="showDrawer" :title="$t('gen.tagger')" :disabled="!context.initialized">
        <TagsOutlined />
    </a-button>

    <a-drawer v-model:visible="visible" title="Tagger" placement="right">
        <a-space direction="vertical">
            <a-select v-model:value="interrogator" :options="interrogatorOptions">
            </a-select>

            <a-upload list-type="picture" accept="image/*" :beforeUpload="beforeUploadImage" :max-count="1">
                <!-- Disable item rendering -->
                <template #itemRender="{ file, actions }"></template>
                <div v-if="unit.image">
                    <a-tag>{{ $t('cnet.preprocessorResult') }}</a-tag>
                    <a-image :src="unit.image.image" :preview="false"></a-image>
                </div>
                <div v-if="!unit.image">
                    <a-button>
                        <UploadOutlined></UploadOutlined>
                        {{ $t('cnet.uploadImage') }}
                    </a-button>
                </div>
            </a-upload>
        </a-space>
    </a-drawer>
</template>
