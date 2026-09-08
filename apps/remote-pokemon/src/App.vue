<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!--
    In standalone mode this provides the page chrome.
    Under the host this same component is mounted as the root of the bridge's
    Vue app, so the wrapping classes duplicate the host's <PublicLayout>
    chrome. That's harmless — the duplicated background-color paints over
    itself — and it keeps a single App component for both modes.
  -->
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <RouterView />
  </div>
</template>