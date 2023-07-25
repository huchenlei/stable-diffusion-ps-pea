<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';
import { useRouter } from 'vue-router';
import { DeleteOutlined } from '@ant-design/icons-vue';
const { $notify } = getCurrentInstance()!.appContext.config.globalProperties;

interface ConnectionItem {
  url: string;
  timestamp: number;
};

let a1111URL = ref("http://localhost:7860");
let connectionHistory = ref<ConnectionItem[]>([]);
const store = useA1111ContextStore();
const router = useRouter();

// Load connection history from localStorage
onMounted(() => {
  const savedHistory = localStorage.getItem('connectionHistory');
  if (savedHistory) {
    connectionHistory.value = JSON.parse(savedHistory).sort(
      (a: ConnectionItem, b: ConnectionItem) => b.timestamp - a.timestamp);
  }
});

async function initializeContext(url: string) {
  try {
    await store.a1111Context.initialize(url);

    // Update connection history and save to localStorage
    const oldEntry = connectionHistory.value.find(item => item.url === url);
    if (oldEntry) {
      oldEntry.timestamp = Date.now();
    } else {
      connectionHistory.value.push({
        url: url,
        timestamp: Date.now()
      });
    }
    localStorage.setItem('connectionHistory', JSON.stringify(connectionHistory.value));

    // ControlNet might not be installed. So even if the initialization failed,
    // we should still navigate to generation page.
    try {
      await store.controlnetContext.initialize(url);
    } catch (e) {
      const msg = `Failed to connect to ControlNet: ${e}`;
      console.warn(msg);
      $notify(msg);
    }
    router.push('/generation');
  } catch (e) {
    const msg = `Connection Failed: ${e}`;
    console.error(msg);
    $notify(msg);
  }
};

function isCurrentConn(conn: ConnectionItem) {
  return store.a1111Context.baseURL === conn.url;
}

function removeConnection(conn: ConnectionItem) {
  connectionHistory.value = connectionHistory.value.filter(c => c !== conn);
  localStorage.setItem('connectionHistory', JSON.stringify(connectionHistory.value));
}

</script>

<template>
  <div>
    <a-space>
      <a-input :addonBefore="$t('con.newConnection')" v-model:value="a1111URL">
      </a-input>
      <a-button @click="initializeContext(a1111URL)">{{ $t('con.connect') }}</a-button>
    </a-space>
    <div v-if="connectionHistory.length">
      <a-list item-layout="horizontal" :data-source="connectionHistory">
        <template #renderItem="{ item: conn }">
          <a-list-item>
            <a-list-item-meta :description="`Last connected: ${new Date(conn.timestamp).toLocaleString()}`">
              <template #title>
                <a :href="conn.url">{{ conn.url }}</a>
              </template>
            </a-list-item-meta>

            <template #actions>
              <a-button v-if="isCurrentConn(conn)" type="primary">{{ $t('con.connected') }}</a-button>
              <a-button v-else @click="initializeContext(conn.url)">{{ $t('con.connect') }}</a-button>
              <div @click="removeConnection(conn)">
                <DeleteOutlined></DeleteOutlined>
              </div>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>
