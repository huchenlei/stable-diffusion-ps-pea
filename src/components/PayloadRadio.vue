<script lang="ts">
export default {
    name: 'PayloadRadio',
    props: {
        value: {
            type: Number,
            required: true,
        },
        enumType: {
            type: Object,
            required: true,
        },
    },
    emits: ['update:value', 'input'],
    setup(props, { emit }) {
        return {
            onRadioChange(e: Event) {
                const target = e.target as HTMLInputElement;
                emit('update:value', target.value);
            }
        };
    },
};
</script>

<template>
    <a-radio-group :value="$props.value" @change="onRadioChange" size="small">
        <a-radio-button v-for="key in Object.values($props.enumType).filter(value => isNaN(Number(value)))" :key="key"
            :value="$props.enumType[key]">
            {{ key }}
        </a-radio-button>
    </a-radio-group>
</template>
