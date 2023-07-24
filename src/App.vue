<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { GithubOutlined, LoginOutlined, PlayCircleOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { reactive } from 'vue';

const context = useA1111ContextStore().a1111Context;
const route = useRoute();

const menuItems = reactive([
  { key: '/', path: '/', icon: LoginOutlined, textKey: 'nav.connection', requiresInit: false },
  { key: '/generation', path: '/generation', icon: PlayCircleOutlined, textKey: 'nav.generation', requiresInit: true },
  { key: '/history', path: '/history', icon: HistoryOutlined, textKey: 'nav.history', requiresInit: true },
  { key: '/config', path: '/config', icon: SettingOutlined, textKey: 'nav.config', requiresInit: false },
]);

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
          <a-menu-item v-for="item in menuItems" :key="item.key">
            <a-tooltip placement="bottom">
              <template #title>
                <span>{{ $t(item.textKey) }}</span>
              </template>
              <RouterLink :to="item.path" :class="{ 'disabled-link': !context.initialized && item.requiresInit }">
                <component :is="item.icon"></component>
              </RouterLink>
            </a-tooltip>
          </a-menu-item>
        </a-menu>
      </a-affix>
    </header>
    <RouterView class="view" />
  </div>
</template>

<style scoped>
.disabled-link {
  opacity: 0.5;
}
</style>
