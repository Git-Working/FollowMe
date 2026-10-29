<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#64748b;flex-shrink:0"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        <span>Automation (Webhooks)</span>
      </div>
      <button type="button" class="guide-btn" @click="isOpen = !isOpen">
        <span>{{ isOpen ? 'Schließen ▲' : 'URLs anzeigen ▼' }}</span>
      </button>
    </div>

    <div class="desc-row">
      <p class="desc-text">Tracking automatisch starten/stoppen — z. B. per WLAN-Heimkehr.</p>
      <button class="info-toggle" type="button" @click="infoOpen = !infoOpen">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </button>
    </div>

    <div class="info-note expandable" :class="{ open: infoOpen }">
      <div>
        <strong>Was ist ein Webhook?</strong> Ein einfacher Weblink. Wenn dein Handy diesen Link im Hintergrund aufruft, weiß der Server sofort, ob du zuhause bist.
        <br /><br />
        <strong>Beispiel iOS (Kurzbefehle):</strong> Automation → Persönliche Automation → WLAN → dein Heimnetz → Aktion "Inhalte von URL abrufen" → Start-URL einfügen. Startet Tracking automatisch, wenn du heimkommst.
      </div>
    </div>

    <div class="expandable" :class="{ open: isOpen }">
      <div class="webhook-box">
        <span class="url-label green">Start (z. B. bei WLAN-Verbindung)</span>
        <input :value="startUrl" class="webhook-url-input" readonly type="text" />
        <div v-if="!mac.trim()" class="mac-warning">
          Bitte zuerst oben deine WLAN-MAC-Adresse eintragen, damit der Start-Webhook funktioniert.
        </div>
        <button
          class="action-btn"
          type="button"
          :disabled="!mac.trim()"
          :class="{ 'btn-disabled': !mac.trim() }"
          @click="copyText(startUrl, 'start')"
        >
          <span>{{ copiedField === 'start' ? 'Kopiert' : 'Start-URL kopieren' }}</span>
        </button>
      </div>

      <div class="webhook-box">
        <span class="url-label red">Stop (z. B. beim Verlassen)</span>
        <input :value="stopUrl" class="webhook-url-input" readonly type="text" />
        <button class="action-btn" type="button" @click="copyText(stopUrl, 'stop')">
          <span>{{ copiedField === 'stop' ? 'Kopiert' : 'Stop-URL kopieren' }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHaptics } from '../composables/useHaptics'

const props = defineProps<{
  name: string
  mac: string
}>()

const isOpen = ref(false)
const infoOpen = ref(false)
const copiedField = ref<'start' | 'stop' | null>(null)
const { vibrate } = useHaptics()

const startUrl = computed(() => {
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
  const encodedName = encodeURIComponent(props.name.trim() || 'Handy')
  return `http://${host}/api/action/start?mac=${props.mac.trim()}&name=${encodedName}`
})

const stopUrl = computed(() => {
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
  return `http://${host}/api/action/stop?mac=${props.mac.trim()}`
})

async function copyText(text: string, field: 'start' | 'stop') {
  vibrate(20)
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => {
      copiedField.value = null
    }, 1800)
  } catch (_) {}
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
  margin-bottom: 8px;
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

.desc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.desc-text {
  font-size: 0.8rem;
  color: #64748b;
}

.info-toggle {
  background: transparent;
  border: none;
  color: #38bdf8;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.info-toggle svg {
  width: 16px;
  height: 16px;
  fill: #38bdf8;
}

.info-note {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.76rem;
  color: #94a3b8;
  line-height: 1.45;
  margin-bottom: 4px;
}

.info-note strong {
  color: #f8fafc;
}

.guide-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px 0;
}

.webhook-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-label {
  font-size: 0.75rem;
  font-weight: 600;
}
.url-label.green { color: #10b981; }
.url-label.red { color: #ef4444; }

.mac-warning {
  font-size: 0.72rem;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  padding: 6px 8px;
  border-radius: 6px;
  line-height: 1.35;
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed !important;
}

.webhook-url-input {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #38bdf8;
  padding: 8px;
  border-radius: 6px;
  width: 100%;
  outline: none;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.7);
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:active {
  transform: scale(0.97);
  background: rgba(30, 41, 64, 0.9);
}

.expandable {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expandable.open {
  max-height: 700px;
  opacity: 1;
}
</style>
