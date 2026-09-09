import { reactive } from 'vue'

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning' | 'neutral'

interface ToastState {
  show: boolean
  message: string
  description: string
  variant: ToastVariant
}

const state = reactive<ToastState>({
  show: false,
  message: '',
  description: '',
  variant: 'success',
})

let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function showToast(
    message: string,
    variant: ToastVariant = 'success',
    duration = 3000,
    description = '',
  ) {
    if (timer) clearTimeout(timer)
    state.message = message
    state.description = description
    state.variant = variant
    state.show = true
    timer = setTimeout(() => {
      state.show = false
    }, duration)
  }

  // Copy fijo (viene de Figma, igual en las 4 vistas) para el toast de error
  // al eliminar/desasociar/asociar — acciones vía ConfirmModal, sin drawer
  // donde mostrar un TSectionMessage con variant="danger".
  function showServiceErrorToast() {
    showToast(
      'No pudimos ejecutar su solicitud',
      'danger',
      3000,
      'Por favor, inténtalo en unos minutos',
    )
  }

  return { toast: state, showToast, showServiceErrorToast }
}
