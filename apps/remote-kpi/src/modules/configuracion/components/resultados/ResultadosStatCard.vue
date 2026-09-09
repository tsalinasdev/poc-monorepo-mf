<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

defineProps({
  value: { type: String, required: true },
  label: { type: String, required: true },
})
</script>

<template>
  <div class="flex-1 self-stretch bg-Surface-Alternative rounded-lg outline outline-1 outline-offset-[-1px] outline-Stroke-Neutral flex flex-col justify-start items-center overflow-hidden">
    <div class="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-Stroke-Neutral"></div>
    <div class="self-stretch flex-1 p-4 flex flex-col justify-center items-start gap-2.5">
      <div class="self-stretch flex-1 flex justify-start items-center gap-4">
        <div class="text-black text-2xl font-bold font-['Inter'] leading-8">{{ value }}</div>
        <div class="flex-1 flex flex-col justify-start items-start gap-1">
          <div class="self-stretch text-Text-Dark-Secondary text-xs font-medium font-['Inter'] leading-4">{{ label }}</div>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
