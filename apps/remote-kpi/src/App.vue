<script setup lang="ts">
import { RouterView } from 'vue-router'
import { TToastNotification } from '@talana/talanify-next'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>

<template>
  <!--
    En standalone este wrapper provee el fondo de la página. Federado, el host
    ya pinta el mismo background (bg-Background-Main del chrome compartido), así
    que la duplicación pinta sobre sí misma — inofensiva, y mantiene un único
    App para ambos modos (mismo patrón que remote-pokemon).
  -->
  <div class="min-h-screen flex flex-col bg-Background-Main text-Text-Dark-Primary">
    <RouterView />
  </div>

  <TToastNotification
    v-model:show="toast.show"
    :variant="toast.variant"
    :title="toast.message"
    placement="top-center"
    has-close
  >
    {{ toast.description }}
  </TToastNotification>
</template>
