<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <span>Aktivitäts-Feed</span>
      </div>
    </div>

    <div class="feed-list">
      <div v-for="item in logs" :key="item.id" class="feed-item">
        <span class="feed-icon">{{ getIcon(item.type) }}</span>
        <span class="feed-text">{{ item.message }}</span>
        <span class="feed-time">{{ item.time }}</span>
      </div>

      <div v-if="logs.length === 0" class="empty-feed">
        Noch keine Ereignisse
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ActivityItem } from '../composables/useTracker'

defineProps<{
  logs: ActivityItem[]
}>()

function getIcon(type: ActivityItem['type']) {
  if (type === 'light') return '💡'
  if (type === 'presence') return '📍'
  if (type === 'clap') return '👏'
  if (type === 'webhook') return '⚡'
  if (type === 'error') return '⚠️'
  return 'ℹ️'
}
</script>

<style scoped>
.card {
  background: rgba(22, 30, 46, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title svg {
  width: 16px;
  height: 16px;
  fill: #64748b;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.feed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.4);
  font-size: 0.8rem;
  color: #94a3b8;
}

.feed-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.feed-text {
  flex: 1;
  text-align: left;
}

.feed-time {
  font-size: 0.72rem;
  color: #64748b;
  font-family: ui-monospace, monospace;
}

.empty-feed {
  text-align: center;
  color: #64748b;
  font-size: 0.8rem;
  padding: 10px;
}
</style>
