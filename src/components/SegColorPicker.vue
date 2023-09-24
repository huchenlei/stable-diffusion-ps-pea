<script lang="ts">
import { BgColorsOutlined } from '@ant-design/icons-vue';
import Papa from 'papaparse';
import { computed, ref } from 'vue';
import { photopeaContext } from '@/Photopea';
import { findActiveColors } from '@/ImageUtil';

interface ColorMap {
    rgb: [number, number, number];
    name: string;
    isStuff: boolean;
};

async function fetchCSV(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
}

function parseRGB(str: string): number[] {
    // Remove leading and trailing parentheses, and split by comma
    const cleanStr = str.replace(/^\(|\)$/g, '');
    const parts = cleanStr.split(',');

    // Map each part to a number
    const numbers = parts.map(part => parseInt(part.trim(), 10));
    return numbers;
}

function parseColorMapCSV(csvText: string): ColorMap[] {
    const results = Papa.parse(csvText, {
        header: true,
    });

    return results.data.map((row: any) => {
        return {
            rgb: parseRGB(row['Color_Code (R,G,B)']),
            name: row['Name'],
            isStuff: row['Stuff'] === 1,
        } as ColorMap;
    });
}

export default {
    name: 'SegColorPicker',
    components: {
        BgColorsOutlined,
    },
    setup(props) {
        const visible = ref<boolean>(false);
        const showDrawer = () => {
            visible.value = true;
        };

        const colorMaps = ref<ColorMap[]>([]);
        fetchCSV('color150.csv').then(csvString => {
            colorMaps.value = parseColorMapCSV(csvString);
        });

        const searchKeyword = ref<string>('');
        const colorsOnCavnas = ref<Set<string>>(new Set());
        const activeColorMaps = computed(() => {
            const reorderedColorMaps = [
                ...colorMaps.value.filter(cm => colorsOnCavnas.value.has(cm.rgb.toString())),
                ...colorMaps.value.filter(cm => !colorsOnCavnas.value.has(cm.rgb.toString())),
            ];
            return reorderedColorMaps.filter(colorMap => {
                return colorMap.name.toLowerCase().includes(searchKeyword.value.toLowerCase());
            });
        });

        function pickColor(rgb: [number, number, number]) {
            photopeaContext.invokeAsTask("pickSegColor", rgb);
        }

        async function findColorsOnCanvas() {
            const imageBuffer = await photopeaContext.invokeAsTask('exportSelectedLayerOnly', 'PNG');
            colorsOnCavnas.value = await findActiveColors(imageBuffer, new Set(colorMaps.value.map(cm => cm.rgb.toString())));
        }

        return {
            visible,
            showDrawer,
            activeColorMaps,
            colorsOnCavnas,
            searchKeyword,
            pickColor,
            findColorsOnCanvas,
        };
    },
};
</script>

<template>
    <a-button type="primary" @click="showDrawer" :title="$t('gen.segColorPicker')">
        <BgColorsOutlined />
    </a-button>
    <a-drawer v-model:visible="visible" title="Segmentation Color Picker" placement="right">
        <a-list size="small" :data-source="activeColorMaps">
            <template #renderItem="{ item }">
                <a-list-item :class="{ onCanvas: colorsOnCavnas.has(item.rgb.toString()) }">
                    <a-space style="flex-wrap: wrap;">
                        <a-button :style="{ backgroundColor: `rgb(${item.rgb.join(',')})` }" @click="pickColor(item.rgb)">
                            <BgColorsOutlined></BgColorsOutlined>
                        </a-button>
                        <span v-for="alias in item.name.split(';')">{{ alias }}</span>
                    </a-space>
                </a-list-item>
            </template>
            <template #header>
                <a-space direction="vertical">
                    <a-button @click="findColorsOnCanvas">{{ $t('gen.findColorsOnCanvas') }}</a-button>
                    <a-input v-model:value="searchKeyword" style="width: 100%" :placeholder="$t('gen.search') + '...'" />
                </a-space>
            </template>
        </a-list>
    </a-drawer>
</template>

<style scoped>
.onCanvas {
    color: #ffdddd;
    /* A light red for the text */
    background-color: #5e0303;
    /* A darker red for the background */
}
</style>