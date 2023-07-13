<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
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
          <a-menu-item key="/generation">
            <RouterLink to="/generation">{{ $t('nav.generation') }}</RouterLink>
          </a-menu-item>
          <a-menu-item key="/about">
            <RouterLink to="/about">{{ $t('nav.about') }}</RouterLink>
          </a-menu-item>
        </a-menu>
      </a-affix>
    </header>
    <RouterView class="view" />
  </div>
</template>
