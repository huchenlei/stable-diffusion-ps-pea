<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { useRouter } from 'vue-router';
import { DeleteOutlined } from '@ant-design/icons-vue';
const { $notify } = getCurrentInstance()!.appContext.config.globalProperties;

</script>

<template>
  <div>
    History Placeholder
  </div>
</template>
