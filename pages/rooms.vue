<template>
  <div class="page-container">
    <div class="page-header">
      <NuxtLink to="/" class="back-link">
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        <span>Zurück zum Dashboard</span>
      </NuxtLink>
      <h1 class="page-title">Räume konfigurieren</h1>
      <p class="page-desc">
        Hier kannst du die Zuordnung zwischen den Raumnamen (für ESP32) und den Home Assistant Entitäten verwalten. Änderungen werden direkt in <code>rooms.json</code> gespeichert.
      </p>
    </div>

    <div v-if="successMsg" class="alert-success">
      {{ successMsg }}
    </div>

    <div v-if="errorMsg" class="alert-error">
      {{ errorMsg }}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Aktive Räume ({{ roomList.length }})</span>
        <button class="add-btn" type="button" @click="addRoom">
          + Raum hinzufügen
        </button>
      </div>

      <div class="room-edit-list">
        <div v-for="(room, idx) in roomList" :key="idx" class="room-edit-item">
          <div class="room-edit-fields">
            <div class="field-col">
              <label class="field-label">Raumname (ESP32 ROOM_ID)</label>
              <input
                v-model="room.id"
                class="text-input"
                type="text"
                placeholder="z.B. wohnzimmer"
                @input="room.id = room.id.toLowerCase().replace(/[^a-z0-9_-]/g, '')"
              />
            </div>
            <div class="field-col">
              <label class="field-label">Home Assistant Entität</label>
              <input
                v-model="room.entity"
                class="text-input entity-input"
                type="text"
                placeholder="z.B. switch.shelly_relay oder light.lampe"
              />
            </div>
          </div>
          <button class="delete-btn" type="button" title="Raum entfernen" @click="removeRoom(idx)">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>

        <div v-if="roomList.length === 0" class="empty-state">
          Keine Räume vorhanden. Klicke auf "+ Raum hinzufügen", um einen neuen Raum anzulegen.
        </div>
      </div>

      <div class="card-actions">
        <button class="save-btn" type="button" :disabled="saving" @click="saveRooms">
          <span>{{ saving ? 'Wird gespeichert...' : 'Änderungen speichern' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RoomItem {
  id: string
  entity: string
}

const roomList = ref<RoomItem[]>([])
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

async function fetchRooms() {
  try {
    const res = await $fetch<{ ok: boolean; rooms: RoomItem[] }>('/api/rooms')
    if (res && res.rooms) {
      roomList.value = res.rooms.map(r => ({ ...r }))
    }
  } catch (err: any) {
    errorMsg.value = `Fehler beim Laden: ${err.message}`
  }
}

function addRoom() {
  roomList.value.push({ id: '', entity: '' })
}

function removeRoom(idx: number) {
  roomList.value.splice(idx, 1)
}

async function saveRooms() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''

  // Validate
  const map: Record<string, string> = {}
  for (const r of roomList.value) {
    const id = r.id.trim().toLowerCase()
    const entity = r.entity.trim()
    if (!id && !entity) continue
    if (!id || !entity) {
      errorMsg.value = 'Bitte fülle für alle Räume sowohl Raumname als auch Entität aus.'
      saving.value = false
      return
    }
    if (map[id]) {
      errorMsg.value = `Der Raumname "${id}" ist doppelt vorhanden!`
      saving.value = false
      return
    }
    map[id] = entity
  }

  try {
    const res = await $fetch<{ ok: boolean; rooms: RoomItem[] }>('/api/rooms', {
      method: 'POST',
      body: { rooms: map },
    })
    if (res && res.ok) {
      successMsg.value = 'Räume erfolgreich gespeichert und angewendet!'
      roomList.value = res.rooms.map(r => ({ ...r }))
      setTimeout(() => { successMsg.value = '' }, 3500)
    }
  } catch (err: any) {
    errorMsg.value = `Fehler beim Speichern: ${err.message}`
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchRooms()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #38bdf8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
}

.back-link svg {
  width: 16px;
  height: 16px;
  fill: #38bdf8;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f8fafc;
}

.page-desc {
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.45;
}

.page-desc code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  color: #38bdf8;
}

.card {
  background: rgba(22, 30, 46, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
}

.add-btn {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.add-btn:active {
  transform: scale(0.96);
}

.room-edit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-edit-item {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.room-edit-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.72rem;
  color: #94a3b8;
}

.text-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.85rem;
  color: #f8fafc;
  outline: none;
}

.text-input:focus {
  border-color: #38bdf8;
}

.entity-input {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
}

.delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
  fill: #ef4444;
}

.delete-btn:active {
  transform: scale(0.92);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
}

.save-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #0284c7;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
}

.save-btn:active {
  transform: scale(0.98);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.82rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.82rem;
}

.empty-state {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  padding: 16px 8px;
}
</style>
