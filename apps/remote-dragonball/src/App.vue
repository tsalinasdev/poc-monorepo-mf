<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Standalone shell only. Under the host this component is never loaded:
       the host provides the layout and the remote contributes routes. -->
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <RouterView />
  </div>
</template>
