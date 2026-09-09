<script setup lang="ts">
/**
 * Header global del shell, portado desde kpi-project/src/layouts/components/Header.vue.
 *
 * Es chrome del host: los remotes nunca lo renderizan. Los props quedan con
 * defaults del demo; cuando exista sesión (JWT, Fase 1 del plan PeopleFirst)
 * los valores llegan de la sesión, no de acá.
 */
import { TAvatar, TButtonIcon } from '@talana/talanify-next'

withDefaults(
  defineProps<{
    userName?: string
    userAvatar?: string
    centerImage?: string
  }>(),
  {
    userName: 'Admin wayne',
    userAvatar: '/img/avatar.png',
    centerImage: '/img/company_logo.png',
  },
)
</script>

<template>
  <header
    class="w-full flex justify-between items-center px-30 py-4 border-b border-Stroke-Neutral bg-white"
  >
    <div class="flex items-center">
      <slot name="logo">
        <div class="flex items-center gap-3">
          <img src="/img/talana_logo.svg" alt="Talana" class="h-7" />
          <div class="w-px h-8 bg-Stroke-Neutral"></div>
          <img src="/img/powered_by.svg" alt="Powered by Talana" class="h-7" />
        </div>
      </slot>
    </div>

    <img class="w-[72px] h-10 object-cover rounded" :src="centerImage" alt="Banner central" />

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <TAvatar :img="userAvatar" :name="userName" size="md" />
        <span class="text-sm font-bold font-[Inter] leading-5 text-Text-Dark-Primary">
          {{ userName }}
        </span>
      </div>

      <div class="w-px h-11 bg-Stroke-NeutralAlternative"></div>

      <TButtonIcon
        icon="material-symbols:notifications-outline"
        variant="tertiary"
        size="md"
        aria-label="Notificaciones"
      />

      <TButtonIcon
        icon="material-symbols:logout"
        variant="tertiary"
        size="md"
        aria-label="Salir"
      />
    </div>
  </header>
</template>
