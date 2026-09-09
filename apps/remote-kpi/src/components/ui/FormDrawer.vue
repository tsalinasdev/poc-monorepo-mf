<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { reactive, ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { TDrawer, TButton, TButtonIcon, TInput, TInputCounter, TSelectText, TTextarea, TSwitch, TRadio, TSectionMessage, TTooltip, TChipStatus } from '@talana/talanify-next'
import { required as requiredValidator } from '@/utils/validators'
import MultiSelectCheckbox from '@/components/ui/MultiSelectCheckbox.vue'

const isRequired = (field) => !!field.rules?.includes(requiredValidator)

const props = defineProps({
  config:        { type: Object, required: true },
  initialValues: { type: Object, default: () => ({}) },
  // Cuando true, el submit queda deshabilitado hasta que formData difiera
  // de su snapshot al abrir — pensado para drawers de "editar" donde no
  // tiene sentido guardar si no se cambió nada.
  requireDirty:  { type: Boolean, default: false },
})

const show = defineModel('show', { type: Boolean, default: false })
// Mensaje de error de conexión/guardado (ej. falla al crear o editar contra
// el backend real) — la View lo setea al capturar el error de su llamada al
// service; se limpia solo al reabrir el drawer o al reintentar el submit.
const serviceError = defineModel('serviceError', { type: String, default: null })
const emit = defineEmits(['submit'])

// Al aparecer el error, el usuario suele estar scrolleado hacia el botón de
// submit (al final del form) y el banner queda fuera de vista arriba —
// scrollIntoView sube el contenido del drawer para que se vea sin tener que
// saber cuál es el contenedor scrolleable interno de TDrawer.
const errorBannerRef = ref(null)
watch(serviceError, (val) => {
  if (val) nextTick(() => errorBannerRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
})

const FIELD_COMPONENTS = {
  text:        TInput,
  date:        TInput,
  number:      TInputCounter,
  select:      TSelectText,
  multiselect: MultiSelectCheckbox,
  textarea:    TTextarea,
  switch:      TSwitch,
}

const visibleSections = computed(() =>
  props.config.sections.filter(s => !s.visible || s.visible(formData))
)

function expandSubFields(fields) {
  return fields.flatMap(f =>
    f.type === 'variable-group' ? [f, ...(f.subFields ?? [])] : [f]
  )
}

const allFields = computed(() =>
  expandSubFields(props.config.sections.flatMap(s => s.fields))
)

const formData = reactive({})
const errors   = reactive({})

const visibleFields = computed(() =>
  visibleSections.value
    .flatMap(s => s.fields)
    .filter(f => !f.visible || f.visible(formData))
    .flatMap(f =>
      f.type === 'variable-group'
        ? (f.subFields ?? []).filter(sf => !sf.visible || sf.visible(formData))
        : [f]
    )
)
function isFieldEmpty(field) {
  const v = formData[field.key]
  return v == null || v === '' || (Array.isArray(v) && v.length === 0)
}

const initialSnapshot = ref({})
const isDirty = computed(() => JSON.stringify(formData) !== JSON.stringify(initialSnapshot.value))

const isSubmitDisabled = computed(() =>
  visibleFields.value.some(f => isRequired(f) && isFieldEmpty(f))
  || visibleFields.value.some(f => isOverLimit(f))
  || (props.requireDirty && !isDirty.value)
)

function initForm() {
  const validKeys = new Set(allFields.value.map(f => f.key))
  allFields.value.forEach(field => {
    if (!(field.key in formData)) {
      formData[field.key] = props.initialValues?.[field.key] ?? field.default ?? null
      errors[field.key]   = null
    }
  })
  Object.keys(formData).forEach(k => {
    if (!validKeys.has(k)) {
      delete formData[k]
      delete errors[k]
    }
  })
}

let fieldWatchStops = []

function setupOnChangeWatchers() {
  fieldWatchStops.forEach(stop => stop())
  fieldWatchStops = []
  allFields.value
    .filter(f => f.onChange)
    .forEach(f => {
      const stop = watch(() => formData[f.key], v => f.onChange(v))
      fieldWatchStops.push(stop)
    })
  allFields.value
    .filter(f => f.syncFrom)
    .forEach(f => {
      const stop = watch(
        () => formData[f.syncFrom],
        v => { formData[f.key] = (v !== null && v !== '' && v !== undefined) ? v : (f.syncFallback ?? null) },
        { immediate: true },
      )
      fieldWatchStops.push(stop)
    })
}

watch(
  () => props.config,
  () => { initForm(); setupOnChangeWatchers() },
  { immediate: true },
)

watch(
  () => props.initialValues,
  (newVals) => {
    allFields.value.forEach(f => {
      formData[f.key] = newVals?.[f.key] ?? f.default ?? null
      errors[f.key]   = null
    })
    allFields.value.filter(f => f.onChange).forEach(f => f.onChange(formData[f.key]))
    setupOnChangeWatchers()
  },
)

onUnmounted(() => fieldWatchStops.forEach(stop => stop()))

function validateField(field) {
  for (const rule of field.rules ?? []) {
    const result = rule(formData[field.key])
    if (result !== true) {
      errors[field.key] = result
      return false
    }
  }
  if (field.validate) {
    const result = field.validate(formData[field.key], formData)
    if (result !== true) {
      errors[field.key] = result
      return false
    }
  }
  errors[field.key] = null
  return true
}

// Agrega el nombre de la variable al final del campo destino (ej. la función),
// escrito entre corchetes — no inserta en la posición del cursor.
function copyVariable(field) {
  const nameKey = field.subFields?.[0]?.key
  const varName = nameKey && formData[nameKey]
  if (!varName || !field.copyToKey) return
  formData[field.copyToKey] = `${formData[field.copyToKey] ?? ''}[${varName}]`
}

function handleSubmit() {
  const valid       = visibleFields.value.map(f => validateField(f)).every(Boolean)
  const noOverLimit = visibleFields.value.every(f => !isOverLimit(f))
  if (valid && noOverLimit) {
    serviceError.value = null
    emit('submit', { ...formData })
  }
}

function resetForm() {
  allFields.value.forEach(f => {
    formData[f.key] = f.default ?? null
    errors[f.key]   = null
  })
}

function handleClose() {
  show.value = false
}

watch(show, (isOpen) => {
  serviceError.value = null
  if (!isOpen) {
    resetForm()
  } else {
    nextTick(() => { initialSnapshot.value = { ...formData } })
  }
})

function isOverLimit(field) {
  return !!field.maxLength && (formData[field.key]?.length ?? 0) > field.maxLength
}

function fieldProps(field) {
  const base = {
    label:       isRequired(field) ? field.label + ' *' : field.label,
    placeholder: field.placeholder,
    hint:        errors[field.key] || (field.truncate ? undefined : field.description) || undefined,
    hasError:    !!errors[field.key] || isOverLimit(field),
  }
  const disabled = typeof field.disabled === 'function' ? field.disabled(formData) : field.disabled
  if (disabled) base.disabled = true
  if (field.type === 'date')    base.type    = 'date'
  if (field.icon)               base.icon    = field.icon
  if (field.min !== undefined)  base.min     = field.min
  if (field.max !== undefined)  base.max     = field.max
  if (field.options && field.type !== 'radio') {
    base.items     = typeof field.options === 'function' ? field.options(formData) : field.options
    base.itemText  = 'label'
    base.itemValue = 'value'
  }
  return base
}

function fieldSpanClass(field) {
  const size = typeof field.size === 'function' ? field.size(formData) : field.size
  if (size === '1/3') return 'col-span-2'
  if (size === '1/2') return 'col-span-3'
  return 'col-span-6'
}

const vNumericOnly = {
  mounted(el, binding) {
    if (binding.value === false) return
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input')
    if (!input) return
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) return
      const allowed = ['Backspace','Delete','Tab','Enter','Escape','ArrowLeft','ArrowRight','Home','End']
      if (allowed.includes(e.key)) return
      if (!/^\d$/.test(e.key)) e.preventDefault()
    }
    el._numericHandler = handler
    input.addEventListener('keydown', handler)
  },
  unmounted(el) {
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input')
    if (input && el._numericHandler) input.removeEventListener('keydown', el._numericHandler)
  },
}

function onNumberInput(field, v) {
  const digits = String(v).replace(/[^\d]/g, '')
  formData[field.key] = digits === '' ? null : Number(digits)
}

function percentDisplay(field) {
  const v = formData[field.key]
  return v !== null && v !== '' ? String(v) : ''
}

const _percentCanvas = document.createElement('canvas')
const _percentCtx    = _percentCanvas.getContext('2d')
_percentCtx.font     = '400 14px Inter, sans-serif'

function percentSuffixStyle(field) {
  const digits = percentDisplay(field)
  if (!digits) return { display: 'none' }
  const w = _percentCtx.measureText(digits).width
  return { position: 'absolute', left: (8 + w + 1) + 'px', bottom: '11px' }
}

function onPercentInput(field, v) {
  const digits = String(v).replace(/[^\d]/g, '')
  formData[field.key] = digits === '' ? null : Number(digits)
}
</script>

<template>
  <TDrawer v-model:show="show" :has-backdrop="true" :has-footer="true" @close="handleClose">
    <template #header>
      <span class="tln:text-body-lg tln:font-bold">{{ config.title }}</span>
    </template>

    <div class="flex flex-col gap-6">
      <TSectionMessage
        ref="errorBannerRef"
        :show="!!serviceError"
        variant="danger"
        icon="mdi:alert-rhombus-outline"
        title="No pudimos ejecutar su solicitud"
      >
        {{ serviceError || 'Por favor, inténtalo en unos minutos' }}
      </TSectionMessage>

      <template v-for="(section, sectionIndex) in visibleSections" :key="section.title ?? section.fields[0].key">
        <div
          :class="[
            'flex flex-col gap-4',
            section.card && 'rounded-xl bg-[#F6F6F6] p-4',
          ]"
        >
          <div v-if="section.title || section.description" class="flex flex-col gap-1">
            <template v-if="section.banner">
              <TSectionMessage show variant="info" icon="mdi:information-slab-circle-outline" :title="section.title">
                {{ section.description }}
              </TSectionMessage>
            </template>
            <template v-else>
              <div class="flex items-center justify-between gap-2">
                <p v-if="section.title" class="text-Text-Dark-Primary text-base font-medium font-['Inter'] leading-6">
                  {{ section.title }}
                </p>
                <TChipStatus v-if="section.badge" variant="primary" class="shrink-0">
                  {{ section.badge }}
                </TChipStatus>
              </div>
              <p v-if="section.description" class="text-xs tln:text-black-400">
                {{ section.description }}
              </p>
            </template>
          </div>

          <div class="grid grid-cols-6 gap-4" style="align-items: start">
            <template v-for="field in section.fields" :key="field.key">
              <div v-if="!field.visible || field.visible(formData)" :class="[fieldSpanClass(field), 'flex flex-col', field.wrapperClass]">

                <!-- Radio group -->
                <template v-if="field.type === 'radio'">
                  <p v-if="field.label" class="text-sm tln:font-medium tln:text-gray-700 mb-2">
                    {{ field.label }}<span v-if="isRequired(field)"> *</span>
                  </p>
                  <div class="radio-options" :class="field.inline === 3 ? 'grid grid-cols-3 gap-2' : field.inline ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-2'">
                    <TRadio
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      v-model="formData[field.key]"
                      :value="opt.value"
                      :title="opt.label"
                      :description="opt.description"
                    />
                  </div>
                  <p v-if="errors[field.key]" class="text-xs tln:text-red-500 mt-1">
                    {{ errors[field.key] }}
                  </p>
                </template>

                <!-- Number text (no stepper, digits only) -->
                <template v-else-if="field.type === 'number-text'">
                  <div v-numeric-only>
                    <TInput
                      :model-value="formData[field.key] ?? ''"
                      :label="isRequired(field) ? field.label + ' *' : field.label"
                      :placeholder="field.placeholder"
                      :has-error="!!errors[field.key]"
                      :hint="errors[field.key] || (field.truncate ? undefined : field.description)"
                      inputmode="numeric"
                      @update:model-value="v => onNumberInput(field, v)"
                    />
                  </div>
                </template>

                <!-- Percent (digits only + % suffix display) -->
                <template v-else-if="field.type === 'percent'">
                  <div
                    v-numeric-only="!field.readonly"
                    class="relative"
                  >
                    <TInput
                      :model-value="percentDisplay(field)"
                      :label="isRequired(field) ? field.label + ' *' : field.label"
                      :placeholder="field.placeholder"
                      :has-error="!!errors[field.key]"
                      :hint="errors[field.key] || (field.truncate ? undefined : field.description)"
                      :readonly="field.readonly || undefined"
                      :inputmode="field.readonly ? undefined : 'numeric'"
                      @update:model-value="v => !field.readonly && onPercentInput(field, v)"
                    />
                    <span
                      v-if="percentDisplay(field)"
                      class="pointer-events-none select-none text-sm text-gray-700"
                      :style="percentSuffixStyle(field)"
                    >%</span>
                  </div>
                </template>

                <!-- Variable group: nombre + valor + trash -->
                <template v-else-if="field.type === 'variable-group'">
                  <div class="flex gap-3 items-end">
                    <template v-for="sf in field.subFields" :key="sf.key">
                      <div class="flex-1">
                        <TInputCounter
                          v-if="sf.type === 'number'"
                          v-model="formData[sf.key]"
                          :label="isRequired(sf) ? sf.label + ' *' : sf.label"
                          :min="sf.min"
                          :hint="errors[sf.key] || undefined"
                          :error="!!errors[sf.key]"
                        />
                        <TInput
                          v-else
                          v-model="formData[sf.key]"
                          :label="isRequired(sf) ? sf.label + ' *' : sf.label"
                          :placeholder="sf.placeholder"
                          :has-error="!!errors[sf.key]"
                          :hint="errors[sf.key] || undefined"
                        />
                      </div>
                    </template>
                    <TButtonIcon
                      v-if="field.copyToKey"
                      icon="material-symbols:content-copy-outline"
                      variant="secondary"
                      size="md"
                      aria-label="Copiar variable"
                      :disabled="!formData[field.subFields?.[0]?.key]"
                      @click="copyVariable(field)"
                    />
                    <TButtonIcon
                      icon="material-symbols:delete-outline"
                      variant="secondary"
                      size="md"
                      aria-label="Eliminar variable"
                      @click="field.onDelete?.()"
                    />
                  </div>
                </template>

                <!-- Calc result: readonly input + calculate button -->
                <template v-else-if="field.type === 'calc-result'">
                  <div class="flex gap-3 items-end">
                    <div class="flex-1">
                      <TInput
                        :model-value="formData[field.key] ?? ''"
                        :label="isRequired(field) ? field.label + ' *' : field.label"
                        readonly
                        :has-error="!!errors[field.key]"
                        :hint="errors[field.key] || undefined"
                      />
                    </div>
                    <TButtonIcon
                      icon="material-symbols:calculate-outline"
                      variant="secondary"
                      size="md"
                      :disabled="field.calcDisabled?.(formData) ?? false"
                      aria-label="Calcular"
                    />
                  </div>
                </template>

                <!-- Section header (title + description, no divider) -->
                <template v-else-if="field.type === 'section-header'">
                  <div>
                    <div class="text-Text-Dark-Primary text-base font-medium font-['Inter'] leading-6">{{ field.label }}</div>
                    <div v-if="field.description" class="text-Text-Dark-Primary text-sm font-normal font-['Inter'] leading-5 mt-1">{{ field.description }}</div>
                  </div>
                </template>

                <!-- Add button -->
                <template v-else-if="field.type === 'add-button'">
                  <TButton variant="secondary" size="sm" @click="field.onClick?.()">
                    {{ field.label }}
                  </TButton>
                </template>

                <!-- Default: dynamic component -->
                <template v-else>
                  <component
                    :is="FIELD_COMPONENTS[field.type]"
                    v-model="formData[field.key]"
                    v-bind="fieldProps(field)"
                  />
                  <div v-if="field.maxLength" class="flex justify-between mt-1 text-xs">
                    <span v-if="isOverLimit(field)" class="tln:text-red-500">Excede el límite de caracteres</span>
                    <span class="ml-auto" :class="isOverLimit(field) ? 'tln:text-red-500' : 'tln:text-black-400'">
                      {{ formData[field.key]?.length ?? 0 }}/{{ field.maxLength }}
                    </span>
                  </div>
                </template>

                <!-- Truncated description — hover activa tooltip encima del campo -->
                <TTooltip
                  v-if="field.truncate && field.description && !errors[field.key]"
                  placement="top"
                  use-teleport
                  content-class="w-[250px] text-center z-[9999999]"
                >
                  <template #activator>
                    <p class="text-xs tln:text-black-400 mt-1 cursor-default">
                      {{ field.description.slice(0, 60) + '...' }}
                    </p>
                  </template>
                  Se define por el límite de<br>
                  cumplimiento. Si no existe, se tomará<br>
                  el porcentaje más alto alcanzado
                </TTooltip>

              </div>
            </template>
          </div>
        </div>
        <div
          v-if="sectionIndex < visibleSections.length - 1"
          class="w-full h-px bg-gray-200"
        />
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end items-center gap-4">
        <TButton variant="tertiary" @click="handleClose">
          {{ config.cancelLabel ?? 'Cancelar' }}
        </TButton>
        <TButton variant="primary" :disabled="isSubmitDisabled" @click="handleSubmit">
          {{ config.submitLabel ?? 'Guardar' }}
        </TButton>
      </div>
    </template>
  </TDrawer>
</template>

<style scoped>
/* Normalize TInputCounter to 40px (default py-3.5 gives ~56px) */
:deep(input[type="number"]) {
  height: 40px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* Borderless +/- buttons, vertically centered within 40px input */
:deep(input[type="number"] ~ div) {
  top: 50% !important;
  transform: translateY(-50%) !important;
}
:deep(input[type="number"] ~ div button) {
  border: 0 !important;
  box-shadow: none !important;
}
/* Drawer panel width override (TDrawer hardcodes max-w-120 = 30rem) */
:deep(.tln\:max-w-120) {
  max-width: 32rem !important;
}

/* Align TInputCounter label→input gap (gap-0.5=2px) to match TSelectText (gap-1=4px) */
:deep(.col-span-3 .tln\:gap-0\.5) {
  gap: 0.25rem !important;
}

/* TSelectText trigger container = 40px content + 2px border = 42px visual.
   TInputCounter input has border inside its height=40px → 40px visual.
   Equalize to 42px so both look the same height when side by side. */
:deep(.col-span-3 input[type="number"]) {
  height: 42px !important;
}

/* Last radio item in 3-col grid: right-aligned */
.radio-options.grid-cols-3 :deep(> :last-child) {
  justify-self: end;
}

/* Radio option title text override */
.radio-options :deep(label > span:first-child) {
  color: var(--color-Text-Dark-Primary) !important;
  font-size: 0.875rem !important;
  font-weight: 400 !important;
  font-family: 'Inter', sans-serif !important;
  line-height: 1.25rem !important;
}

/* Compact TInputCounter for 1/3-width columns (col-span-2 ~122px).
   Layout: [~1/3 text | ~1/3 minus | ~1/3 plus]                     */
:deep(.col-span-2 input[type="number"]) {
  padding-left: 0.25rem !important;
  padding-right: 5rem !important;
  text-align: center !important;
}
:deep(.col-span-2 input[type="number"] ~ div) {
  gap: 0 !important;
  right: 0 !important;
}
:deep(.col-span-2 input[type="number"] ~ div button) {
  width: 2.5rem !important;
  min-width: 0 !important;
}
</style>
