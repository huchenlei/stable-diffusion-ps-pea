<script lang="ts">
import { BgColorsOutlined } from '@ant-design/icons-vue';
import Papa from 'papaparse';
import { computed, getCurrentInstance, ref, nextTick } from 'vue';
import { photopeaContext } from '@/Photopea';

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
    setup(props, { emit }) {
        const visible = ref<boolean>(false);
        const showDrawer = () => {
            visible.value = true;
        };

        return {
            visible,
            showDrawer,
        };
    },
};
</script>

<template>
    <a-button type="primary" @click="showDrawer" :title="$t('gen.segColorPicker')">
        <BgColorsOutlined />
    </a-button>
    <a-drawer v-model:visible="visible" title="Seg Color Picker" placement="right">

    </a-drawer>
</template>

<style scoped></style>