<template>
  <div class="app-wrapper">
    <div class="app-container">
      <AppHeader :ha-configured="haConfigured" />
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTracker } from './composables/useTracker'

const { haConfigured } = useTracker()
</script>

<style>
:root {
  --bg-main: #090d16;
  --bg-card: rgba(22, 30, 46, 0.75);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --text-primary: #f8fafc;
  --accent-blue: #38bdf8;
  --accent-green: #10b981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, #172554 0%, var(--bg-main) 70%);
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif;
  line-height: 1.45;
  user-select: none;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom)) 16px;
}

.app-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
