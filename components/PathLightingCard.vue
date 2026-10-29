<template>
  <section class="card">
    <div class="section-header">
      <div class="section-title">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#64748b;flex-shrink:0"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>
        <span>Pfad-Beleuchtung</span>
      </div>
      <label class="switch">
        <input
          v-model="pathConfig.enabled"
          type="checkbox"
        />
        <span class="slider"></span>
      </label>
    </div>

    <div class="desc-row">
      <p class="desc-text">Schaltet beim Raumwechsel den Flur automatisch ein.</p>
      <button class="info-toggle" type="button" @click="infoOpen = !infoOpen">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </button>
    </div>
    <div class="info-note expandable" :class="{ open: infoOpen }">
      <div>Wenn du nachts den Raum wechselst, schaltet das System den Flur automatisch ein. Nach der eingestellten Nachlaufzeit geht das Licht von selbst wieder aus.</div>
    </div>

    <div class="expandable" :class="{ open: pathConfig.enabled }">
      <div class="form-group" style="padding-top: 8px;">
        <div>
          <label class="input-label">Welcher Raum dient als Flur/Durchgang?</label>
          <select v-model="pathConfig.hallwayRoom" class="select-input">
            <option v-for="room in rooms" :key="room" :value="room">
              {{ formatRoomTitle(room) }}
            </option>
          </select>
        </div>

        <div>
          <label class="input-label">Nachlaufzeit Flur-Licht (Sekunden):</label>
          <input
            v-model.number="pathConfig.durationSec"
            class="text-input"
            type="number"
            min="5"
            max="300"
            step="5"
          />
        </div>

        <button class="action-btn" type="button" @click="handleSave">
          <span>{{ savedSuccess ? 'Gespeichert' : 'Speichern' }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings'

const props = defineProps<{
  rooms: string[]
}>()

const { pathLighting, fetchSettings, savePathLighting } = useSettings()
const infoOpen = ref(false)
const pathConfig = ref({
  enabled: false,
  hallwayRoom: '',
  durationSec: 30,
})
const savedSuccess = ref(false)

onMounted(async () => {
  await fetchSettings()
  pathConfig.value = { ...pathLighting.value }
  if (!pathConfig.value.hallwayRoom && props.rooms.length > 0) {
    pathConfig.value.hallwayRoom = props.rooms.find(r => r.includes('flur')) || props.rooms[0]
  }
})

function formatRoomTitle(roomId: string) {
  if (!roomId) return 'Unbekannt'
  return roomId.charAt(0).toUpperCase() + roomId.slice(1)
}

async function handleSave() {
  const ok = await savePathLighting(pathConfig.value)
  if (ok) {
    savedSuccess.value = true
    setTimeout(() => {
      savedSuccess.value = false
    }, 1600)
  }
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
  line-height: 1.4;
  margin-bottom: 4px;
}

.explainer-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 12px;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.45;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.explainer-box strong {
  color: #f8fafc;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-label {
  font-size: 0.78rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}

.select-input, .text-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.95rem;
  color: #f8fafc;
  outline: none;
}

.select-input:focus, .text-input:focus {
  border-color: #38bdf8;
  background: rgba(15, 23, 42, 0.9);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.7);
  color: #f8fafc;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

.action-btn:active {
  transform: scale(0.97);
  background: rgba(30, 41, 64, 0.9);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 30px;
  flex-shrink: 0;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #334155;
  transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }

.expandable {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expandable.open {
  max-height: 500px;
  opacity: 1;
}
</style>
