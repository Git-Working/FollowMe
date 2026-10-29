<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-9 9c0 2.4.9 4.6 2.4 6.2l1.4-1.4A6.9 6.9 0 0 1 5 12a7 7 0 1 1 14 0c0 1.9-.8 3.7-2.1 5l1.4 1.4A8.9 8.9 0 0 0 21 12a9 9 0 0 0-9-9z"/></svg>
        <span>Signal-Kalibrierung</span>
      </div>
      <button type="button" class="guide-btn" @click="isOpen = !isOpen">
        <span>{{ isOpen ? 'Schließen ▲' : 'Anpassen ▼' }}</span>
      </button>
    </div>

    <div class="desc-row">
      <p class="desc-text">Empfindlichkeit pro Raum anpassen, falls Wände das Signal dämpfen.</p>
      <button class="info-toggle" type="button" @click="infoOpen = !infoOpen">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </button>
    </div>

    <div class="info-note expandable" :class="{ open: infoOpen }">
      <div>
        <strong>Wozu dient das?</strong> Jeder ESP32-Sensor steht woanders. Signal durch eine Wand ist schwächer als im offenen Flur. Wenn das System dich im falschen Raum erkennt: Stell dich in den richtigen Raum und tippe auf <strong>Einmessen</strong>. Das System korrigiert sich automatisch.
      </div>
    </div>

    <div class="expandable" :class="{ open: isOpen }">
      <div style="padding-top: 8px;">
        <div v-for="room in rooms" :key="room" class="cal-row">
          <div>
            <strong style="font-size: 0.88rem;">{{ getRoomIcon(room) }} {{ formatRoomTitle(room) }}</strong>
            <div style="font-size: 0.72rem; color: #64748b;">
              Signal: {{ signals[room]?.rssi !== undefined ? `${signals[room].rssi} dBm` : 'Kein Signal' }}
            </div>
          </div>

          <div class="cal-controls">
            <button class="cal-btn" title="Empfindlichkeit verringern" @click="adjust(room, -1)">-</button>
            <span class="cal-val">{{ (calibrations[room] || 0) > 0 ? '+' : '' }}{{ calibrations[room] || 0 }} dB</span>
            <button class="cal-btn" title="Empfindlichkeit erhöhen" @click="adjust(room, 1)">+</button>
            <button class="cal-snap-btn" title="Signal jetzt als Referenz speichern" @click="handleSnap(room)">Einmessen</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCalibration } from '../composables/useCalibration'
import type { RoomSignal } from '../composables/useTracker'

const props = defineProps<{
  rooms: string[]
  signals: Record<string, RoomSignal>
}>()

const isOpen = ref(false)
const infoOpen = ref(false)
const { calibrations, fetchCalibration, adjust, snap } = useCalibration()

onMounted(() => {
  fetchCalibration()
})

function getRoomIcon(roomId: string) {
  const id = roomId.toLowerCase()
  if (id.includes('wohn')) return '🛋️'
  if (id.includes('kueche') || id.includes('küche')) return '🍳'
  if (id.includes('schlaf')) return '🛏️'
  if (id.includes('bad')) return '🚿'
  if (id.includes('flur') || id.includes('diele')) return '🚪'
  return '🏠'
}

function formatRoomTitle(roomId: string) {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1)
}

async function handleSnap(room: string) {
  const sig = props.signals[room]
  const raw = sig ? sig.rssi : null
  await snap(room, raw)
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

.section-title svg {
  width: 16px;
  height: 16px;
  fill: #64748b;
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

.cal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  margin-bottom: 8px;
}

.cal-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cal-btn:active { transform: scale(0.92); }

.cal-val {
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  min-width: 48px;
  text-align: center;
}

.cal-snap-btn {
  padding: 5px 9px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.cal-snap-btn:active { transform: scale(0.95); }

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
