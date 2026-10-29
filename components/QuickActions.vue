<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
        <span>Schnellaktionen</span>
      </div>
    </div>

    <div class="action-grid">
      <button class="action-btn" type="button" @click="$emit('clap')">
        <svg viewBox="0 0 24 24" class="btn-icon"><path d="M11 7.5V5a1 1 0 0 1 2 0v2.5h1V4a1 1 0 0 1 2 0v3.5h.5a2.5 2.5 0 0 1 2.5 2.5v3A6.5 6.5 0 0 1 12.5 19.5h-.5A6 6 0 0 1 6 13.5v-3a1 1 0 1 1 2 0v2h1V5.5a1 1 0 0 1 2 0V7.5z"/></svg>
        <span>Klatsch-Test</span>
      </button>
      <button class="action-btn" type="button" @click="$emit('refresh')">
        <svg viewBox="0 0 24 24" class="btn-icon"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        <span>Aktualisieren</span>
      </button>
    </div>

    <button class="info-toggle" type="button" @click="infoOpen = !infoOpen">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      Was macht der Klatsch-Test?
    </button>
    <div class="info-note expandable" :class="{ open: infoOpen }">
      <div>
        Sendet ein simuliertes Doppelklatsch-Signal an Home Assistant — genau wie das Mikrofon am ESP32. So prüfst du, ob das Licht schaltet, ohne selbst Krach machen zu müssen.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const infoOpen = ref(false)
defineEmits<{
  (e: 'clap'): void
  (e: 'refresh'): void
}>()
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

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.97);
  background: rgba(30, 41, 64, 0.9);
}

.btn-icon {
  width: 18px;
  height: 18px;
  fill: #94a3b8;
  flex-shrink: 0;
}

.info-toggle {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 2px;
}

.info-toggle svg {
  width: 14px;
  height: 14px;
  fill: #38bdf8;
  flex-shrink: 0;
}

.info-note {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.76rem;
  color: #94a3b8;
  line-height: 1.4;
  margin-top: 6px;
}

.expandable {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expandable.open {
  max-height: 200px;
  opacity: 1;
}
</style>
