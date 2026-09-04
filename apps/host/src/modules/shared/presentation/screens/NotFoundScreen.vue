<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="mx-auto max-w-5xl p-8">
    <h1 class="text-xl font-bold">Page not found</h1>
    <p class="mt-2 text-sm text-gray-600">
      No section of this application answers that address.
      <RouterLink to="/" class="underline">Go back to the start</RouterLink>.
    </p>
  </div>
</template>
