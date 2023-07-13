<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
const route = useRoute();
</script>

<template>
  <!-- Extra layer of div to bypass grid constraint -->
  <div>
    <header>
      <a-menu class="navigation" mode="horizontal" :selectedKeys="[route.path]">
        <a-menu-item key="/">
          <RouterLink to="/">{{ $t('nav.connection') }}</RouterLink>
        </a-menu-item>
        <a-menu-item key="/generation">
          <RouterLink to="/generation">{{ $t('nav.generation') }}</RouterLink>
        </a-menu-item>
        <a-menu-item key="/about">
          <RouterLink to="/about">{{ $t('nav.about') }}</RouterLink>
        </a-menu-item>
      </a-menu>
    </header>
    <RouterView class="view"/>
  </div>
</template>

<style scoped>
.navigation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  /* ensure it's on top of other elements */
}
.view {
  margin-top: 50px;
}

</style>