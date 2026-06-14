<script setup lang="ts">
// AppHeader. Persistent strip mounted above <router-view />. Shows a dev
// banner with fixture picker, an admin banner with impersonation control,
// or nothing for ordinary user mode.
import { useAppMode } from '../composables/useAppMode';
import ImpersonationControl from './ImpersonationControl.vue';

const mode = useAppMode();
</script>

<template>
  <header
    v-if="mode === 'dev'"
    class="app-header-bar app-header-bar-dev"
  >
    <div class="app-header-bar-inner">
      <span class="app-header-bar-tag">WAEL dev</span>
      <nav class="app-header-bar-nav">
        <RouterLink to="/assessment">
          Assessment
        </RouterLink>
        <RouterLink to="/results">
          Results
        </RouterLink>
        <RouterLink to="/laboratory">
          Laboratory
        </RouterLink>
        <RouterLink to="/fixtures">
          Fixtures
        </RouterLink>
      </nav>
    </div>
  </header>
  <header
    v-else-if="mode === 'admin'"
    class="app-header-bar app-header-bar-admin"
  >
    <div class="app-header-bar-inner">
      <span class="app-header-bar-tag">Admin</span>
      <nav class="app-header-bar-nav">
        <RouterLink to="/assessment">
          Assessment
        </RouterLink>
        <RouterLink to="/results">
          Results
        </RouterLink>
        <RouterLink to="/laboratory">
          Laboratory
        </RouterLink>
        <RouterLink to="/fixtures">
          Fixtures
        </RouterLink>
      </nav>
      <ImpersonationControl />
    </div>
  </header>
</template>
