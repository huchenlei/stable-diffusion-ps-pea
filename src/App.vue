<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { GithubOutlined, LoginOutlined, PlayCircleOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { reactive } from 'vue';

const context = useA1111ContextStore().a1111Context;
const route = useRoute();

const menuItems = reactive([
  { key: '/', path: '/', icon: LoginOutlined, textKey: 'nav.connection', showText: false, requiresInit: false },
  { key: '/generation', path: '/generation', icon: PlayCircleOutlined, textKey: 'nav.generation', showText: false, requiresInit: true },
  { key: '/history', path: '/history', icon: HistoryOutlined, textKey: 'nav.history', showText: false, requiresInit: true },
  { key: '/config', path: '/config', icon: SettingOutlined, textKey: 'nav.config', showText: false, requiresInit: false },
]);

function handleMouseEnter(item: { showText: boolean }) {
  item.showText = true;
}

function handleMouseLeave(item: { showText: boolean }) {
  item.showText = false;
}
</script>

<template>
  <!-- Extra layer of div to bypass grid constraint -->
  <div>
    <header>
      <a-affix :offset-top="0" style="margin-bottom: 10px;">
        <a-menu class="navigation" mode="horizontal" :selectedKeys="[route.path]">
          <a-menu-item key="/github">
            <a href="https://github.com/huchenlei/stable-diffusion-ps-pea" target="_blank"><github-outlined /></a>
          </a-menu-item>
          <a-menu-item v-for="item in menuItems" :key="item.key"
            @mouseover="handleMouseEnter(item)" @mouseleave="handleMouseLeave(item)">
            <RouterLink :to="item.path" :class="{ 'disabled-link': !context.initialized && item.requiresInit }">
              <component :is="item.icon"></component>
              <span :hidden="!item.showText">{{ $t(item.textKey) }}</span>
            </RouterLink>
          </a-menu-item>
        </a-menu>
      </a-affix>
    </header>
    <RouterView class="view" />
  </div>
</template>

<style scoped>
.disabled-link {
  pointer-events: none;
  opacity: 0.5;
}
</style>
