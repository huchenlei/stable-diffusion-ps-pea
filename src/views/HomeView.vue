<script setup lang="ts">
import { ref } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { useRouter } from 'vue-router';

const a1111URL = ref("http://localhost:7860");
const store = useA1111ContextStore();
const router = useRouter();

const initializeContext = async () => {
  if (await store.a1111Context.initialize(a1111URL.value)) {
    router.push('/generation');
  }
};
</script>

<template>
  <div>
    <a-input addonBefore="A1111 URL:" :value="a1111URL" @input="(value: string) => a1111URL = value">
    </a-input>
    <a-button @click="initializeContext">{{ $t('connect') }}</a-button>
  </div>
</template>
