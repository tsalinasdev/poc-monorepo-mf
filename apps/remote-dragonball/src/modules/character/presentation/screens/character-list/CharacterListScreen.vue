<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCharacterListViewModel } from './useCharacterListViewModel'

const { cards, page, totalPages, isLoading, error, nextPage, prevPage } =
  useCharacterListViewModel()
</script>

<template>
  <section class="mx-auto max-w-5xl p-6">
    <h1 class="mb-6 text-3xl font-bold text-orange-600">Dragon Ball</h1>

    <p v-if="isLoading" class="text-gray-500">Loading…</p>
    <p v-else-if="error" role="alert" class="rounded bg-red-50 p-4 text-red-700">{{ error }}</p>

    <template v-else>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <li v-for="card in cards" :key="card.id">
          <RouterLink
            :to="{ name: 'character-detail', params: { id: card.id } }"
            class="block rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <img
              :src="card.imageUrl"
              :alt="card.name"
              class="mx-auto h-32 w-24 object-contain"
              loading="lazy"
            />
            <p class="mt-2 font-semibold">{{ card.name }}</p>
            <p class="text-xs text-gray-400">{{ card.race }} · {{ card.affiliation }}</p>
          </RouterLink>
        </li>
      </ul>

      <footer class="mt-8 flex items-center justify-center gap-4">
        <button
          class="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-40"
          :disabled="page <= 1"
          @click="prevPage"
        >
          ← Prev
        </button>
        <span class="text-sm text-gray-600">Page {{ page }} of {{ totalPages }}</span>
        <button
          class="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-40"
          :disabled="totalPages > 0 && page >= totalPages"
          @click="nextPage"
        >
          Next →
        </button>
      </footer>
    </template>
  </section>
</template>
