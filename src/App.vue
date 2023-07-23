<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
const context = useA1111ContextStore().a1111Context;
const route = useRoute();
</script>

<template>
  <!-- Extra layer of div to bypass grid constraint -->
  <div>
    <header>
      <a-affix :offset-top="0">
        <a-menu class="navigation" mode="horizontal" :selectedKeys="[route.path]">
          <a-menu-item key="/">
            <RouterLink to="/">{{ $t('nav.connection') }}</RouterLink>
          </a-menu-item>
          <a-menu-item key="/generation" :disabled="!context.initialized">
            <RouterLink to="/generation">{{ $t('nav.generation') }}</RouterLink>
          </a-menu-item>
          <a-menu-item key="/history" :disabled="!context.initialized">
            <RouterLink to="/history">{{ $t('nav.history') }}</RouterLink>
          </a-menu-item>
        </a-menu>
      </a-affix>
    </header>
    <RouterView class="view" />
  </div>
</template>

<style scoped>
.class {
  width: 100%;
}
</style>
