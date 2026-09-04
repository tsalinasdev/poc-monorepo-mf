<script setup lang="ts">
/**
 * Shown in place of a section whose remote could not be loaded.
 *
 * The shell cannot know the remote's inner routes when its contract never
 * arrived, so it answers the section's base path with this instead of a blank
 * page. Everything else in the application keeps working.
 */
withDefaults(defineProps<{ sectionLabel?: string }>(), { sectionLabel: 'This section' })
</script>

<template>
  <div class="mx-auto max-w-5xl p-8">
    <div class="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h1 class="text-xl font-bold text-amber-900">{{ sectionLabel }} is unavailable</h1>
      <p class="mt-2 text-sm text-amber-800">
        This part of the application is served by a separate deployment that could not be reached.
        The rest of the site is unaffected — try again in a moment.
      </p>
    </div>
  </div>
</template>
