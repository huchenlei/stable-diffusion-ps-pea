<script lang="ts">
import { computed } from 'vue';

export default {
    name: 'SliderGroup',
    props: {
        value: {
            type: Number,
            required: true,
        },
        min: {
            type: Number,
            default: 0,
        },
        max: {
            type: Number,
            default: 1,
        },
        label: {
            type: String,
            required: true,
        },
        step: {
            type: Number,
            required: false
        }
    },
    emits: ['update:value'],
    setup(props, { emit }) {
        const step = computed(() => {
            return props.step ? props.step : (props.max - props.min) / 20;
        });
        return {
            onValueChange(value: number) {
                emit('update:value', value);
            },
            step,
        }
    },
}
</script>

<template>
    <a-row>
        <a-col :span="24" class="container">
            <a-tag class="label">
                {{ $props.label }}
            </a-tag>
            <a-input-number :value="$props.value" :min="$props.min" :max="$props.max" @update:value="onValueChange"
                size="small" />
        </a-col>
        <a-col :span="24">
            <a-slider :value="$props.value" :min="$props.min" :max="$props.max" @update:value="onValueChange"
                :step="step" />
        </a-col>
    </a-row>
</template>

<style scoped>
.label {
    border: none;
}

.container {
    display: flex;
    justify-content: space-between;
}
</style>