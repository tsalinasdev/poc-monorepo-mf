// @ts-nocheck
import { ref, computed } from 'vue'
import { required, minValue, maxValue } from '@/utils/validators'

const ORDINALS = [
  'primer',
  'segundo',
  'tercer',
  'cuarto',
  'quinto',
  'sexto',
  'séptimo',
  'octavo',
  'noveno',
  'décimo',
]

const noNegative = minValue(0, 'No puede ser negativo')
const maxHundred = maxValue(100, 'No puede ser mayor a 100')
const minNiveles = minValue(3, 'Mínimo 3 niveles')
const maxNiveles = maxValue(10, 'Máximo 10 niveles')

const currentYear = new Date().getFullYear()

export function useCicloDrawer() {
  const mode = ref('create')
  const nivelesCount = ref(3)

  function setMode(m) {
    mode.value = m
  }

  const drawerConfig = computed(() => ({
    title: mode.value === 'edit' ? 'Editar ciclo KPI' : 'Agregar ciclo KPI',
    submitLabel: mode.value === 'edit' ? 'Guardar cambios' : 'Agregar',
    cancelLabel: 'Cancelar',
    sections: [
      {
        title: 'Configuración principal',
        fields: [
          {
            key: 'nombre',
            type: 'text',
            label: 'Nombre',
            placeholder: 'Ingresa un nombre de ciclo',
            maxLength: 100,
            rules: [required],
            size: 1,
          },
          {
            key: 'cicloDesempeno',
            type: 'select',
            label: 'Ciclo desempeño asociado',
            description: 'La nota del KPI se considerará en el puntaje final y nine box.',
            options: [
              { label: 'Ninguno', value: null },
              { label: 'Ciclo 2024', value: 'ciclo-2024' },
              { label: 'Ciclo 2025', value: 'ciclo-2025' },
              { label: 'Ciclo 2026', value: 'ciclo-2026' },
            ],
            rules: [],
            size: 1,
          },
          {
            key: 'tipoCiclo',
            type: 'radio',
            label: 'Tipo de ciclo',
            options: [
              {
                label: 'Centralizado',
                value: 'centralizado',
                description:
                  'El administrador propone y asigna los KPIs a todos y los trabajadores sólo los reciben.',
              },
              {
                label: 'Top-down (De arriba hacia abajo)',
                value: 'top-down',
                description:
                  'El líder propone los KPIs a su equipo, el trabajador los revisa y los valida.',
              },
              {
                label: 'Bottom-up (De abajo hacia arriba)',
                value: 'bottom-up',
                description:
                  'El trabajador propone sus propios KPIs, el líder los revisa y los valida.',
              },
            ],
            default: 'centralizado',
            rules: [required],
            size: 1,
          },
        ],
      },
      {
        title: 'Duración del ciclo',
        fields: [
          {
            key: 'fechaInicio',
            type: 'date',
            label: 'Fecha de inicio',
            icon: 'calendar-today',
            default: `${currentYear}-01-01`,
            rules: [],
            size: '1/2',
          },
          {
            key: 'fechaFin',
            type: 'date',
            label: 'Fecha de finalización',
            icon: 'calendar-today',
            default: `${currentYear}-12-31`,
            rules: [],
            size: '1/2',
          },
          {
            key: 'fechaPlanificacion',
            type: 'date',
            label: 'Fecha fin de planificación',
            icon: 'calendar-today',
            rules: [],
            validate: (v, fd) =>
              !v || !fd.fechaFin || v < fd.fechaFin || 'Debe ser menor a la fecha de finalización',
            size: 1,
            visible: (fd) => fd.tipoCiclo === 'top-down' || fd.tipoCiclo === 'bottom-up',
          },
        ],
      },
      {
        title: 'Medición del ciclo',
        fields: [
          {
            key: 'limiteCumplimiento',
            type: 'number-text',
            label: '% Límite de cumplimiento',
            placeholder: 'Ingresa un %',
            default: 0,
            rules: [noNegative, maxHundred],
            size: '1/2',
          },
          {
            key: 'limitePersona',
            type: 'number',
            label: 'Límite KPI por persona',
            placeholder: '0',
            default: 0,
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'decimales',
            type: 'number',
            label: 'Cantidad de decimales',
            placeholder: '0',
            description: 'Se muestra en el valor del cumplimiento',
            default: 0,
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'ponderadorMinimo',
            type: 'number-text',
            label: 'Ponderador mínimo',
            placeholder: 'Ingresa un %',
            description: 'Ponderador mínimo de los KPI que tienen las personas',
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'verAcumulado',
            type: 'radio',
            label: 'Ver acumulado',
            options: [
              { label: 'No', value: false },
              { label: 'Sí', value: true },
            ],
            default: false,
            rules: [],
            size: '1/2',
          },
          {
            key: 'estado',
            type: 'radio',
            label: 'Estado',
            options: [
              { label: 'Activo', value: 'activo' },
              { label: 'Inactivo', value: 'inactivo' },
            ],
            default: 'activo',
            rules: [],
            size: '1/2',
          },
        ],
      },
      {
        title: 'Escala de interpretación',
        description:
          'Traduce los porcentajes de cumplimiento de los KPI a categorías cualitativas.',
        card: true,
        fields: [
          {
            key: '_nivelesCount',
            type: 'number',
            label: 'Niveles de escala',
            description: 'Nivel de escala de interpretación para el límite de cumplimiento del KPI',
            default: 3,
            min: 3,
            max: 10,
            rules: [minNiveles, maxNiveles],
            size: 1,
            onChange: (v) => {
              nivelesCount.value = Math.min(10, Math.max(3, Number(v) || 3))
            },
          },
          ...Array.from({ length: nivelesCount.value }, (_, i) => {
            const isLast = i === nivelesCount.value - 1
            return [
              {
                key: `nivel_nombre_${i}`,
                type: 'text',
                label: `Nombre ${ORDINALS[i] ?? `${i + 1}°`} nivel`,
                rules: [required],
                size: '1/2',
              },
              {
                key: `nivel_tope_${i}`,
                type: 'percent',
                label: `Tope del ${ORDINALS[i] ?? `${i + 1}°`} nivel`,
                description: isLast
                  ? 'Se define por el límite de cumplimiento. Si no existe, se tomará el porcentaje más alto alcanzado'
                  : undefined,
                truncate: isLast,
                readonly: isLast,
                syncFrom: isLast ? 'limiteCumplimiento' : undefined,
                syncFallback: isLast ? 0 : undefined,
                rules: isLast ? [] : [required],
                size: '1/2',
              },
            ]
          }).flat(),
        ],
      },
    ],
  }))

  return { drawerConfig, mode, setMode }
}
