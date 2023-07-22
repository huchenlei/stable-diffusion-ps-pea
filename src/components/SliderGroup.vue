<script lang="ts">
import { computed } from 'vue';

enum ChangeSource {
    kInputBox,
    kSlider,
};

export default {
    name: 'SliderGroup',
    props: {
        value: {
            type: Number,
            required: true,
        },
        min: {
            type: Number,
            default: 1,
        },
        max: {
            type: Number,
            default: 100,
        },
        label: {
            type: String,
            required: true,
        },
        step: {
            type: Number,
            required: false,
        },
        logScale: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:value'],
    setup(props, { emit }) {
        const step = computed(() => {
            if (props.logScale)
                return 1;

            return props.step ? props.step : 1;
        });

        const logValue = computed(() => {
            return props.logScale ? Math.log2(props.value) : props.value;
        });

        const logMax = computed(() => {
            return props.logScale ? Math.log2(props.max) : props.max;
        });

        const logMin = computed(() => {
            return props.logScale ? Math.log2(props.min) : props.min;
        });

        return {
            onValueChange(value: number, source: ChangeSource) {
                if (source === ChangeSource.kSlider)
                    emit('update:value', props.logScale ? Math.pow(2, value) : value);
                else
                    emit('update:value', value);
            },
            formatTooltip(value: number) {
                return props.logScale ? Math.pow(2, value) : value;
            },
            step,
            logValue,
            logMin,
            logMax,
            ChangeSource,
        }
    },
}
</script>

<template>
    <a-row class="row">
        <a-col :span="24" class="container">
            <a-tag class="label">
                {{ $props.label }}
            </a-tag>
            <a-input-number :value="$props.value" :min="$props.min" :max="$props.max"
                @update:value="(value: number) => onValueChange(value, ChangeSource.kInputBox)" size="small" />
        </a-col>
        <a-col :span="24">
            <a-slider :value="logValue" :min="logMin" :max="logMax"
                @update:value="(value: number) => onValueChange(value, ChangeSource.kSlider)" :tipFormatter="formatTooltip"
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

/* Take as much space as possible if put in a flex container */
.row {
    flex-grow: 1;
}
</style>