// @ts-nocheck
import { ref, computed } from 'vue'
import { required, minValue } from '@/utils/validators'

const noNegative = minValue(0, 'No puede ser negativo')

const UNIDADES_OPTIONS = [
  { label: 'Días', value: 'Días' },
  { label: 'Unidades', value: 'Unidades' },
  { label: 'US$', value: 'US$' },
  { label: 'UF', value: 'UF' },
  { label: '%', value: '%' },
]

// Variables entre corchetes ([Nombre]) referenciando una variable declarada;
// fuera de los corchetes solo números y operadores permitidos: + - * / ^ ().
function validateFuncionFormula(formula, fd) {
  if (!formula) return true

  const withoutBrackets = formula.replace(/\[[^[\]]*\]/g, ' ')
  if (withoutBrackets.includes('[') || withoutBrackets.includes(']')) {
    return 'Los corchetes no están balanceados'
  }

  const declaredNames = Object.keys(fd)
    .filter((k) => /^variable_nombre_\d+$/.test(k))
    .map((k) => fd[k])
    .filter(Boolean)

  const referenced = [...formula.matchAll(/\[([^[\]]*)\]/g)].map((m) => m[1])
  const unknownVar = referenced.find((name) => !declaredNames.includes(name))
  if (unknownVar !== undefined) {
    return `La variable [${unknownVar}] no existe`
  }

  if (!/^[0-9+\-*/^().\s]*$/.test(withoutBrackets)) {
    return 'Solo se permiten las operaciones: + - * / ^ ()'
  }

  return true
}

export function useKpiDrawer({ ciclosOptions, kpis, kpiToEdit }) {
  const mode = ref('create')
  const rangosCount = ref(2)
  const variableIndices = ref([0, 1])
  let _nextVarId = 2

  function setMode(m) {
    mode.value = m
  }

  function addVariable() {
    variableIndices.value = [...variableIndices.value, _nextVarId++]
  }
  function removeVariable(id) {
    if (variableIndices.value.length <= 1) return
    variableIndices.value = variableIndices.value.filter((vid) => vid !== id)
  }
  function initVariables(n) {
    const count = Math.max(1, Number(n) || 1)
    variableIndices.value = Array.from({ length: count }, (_, i) => i)
    _nextVarId = count
  }

  const drawerConfig = computed(() => ({
    title: mode.value === 'edit' ? 'Editar KPI' : 'Agregar KPI',
    submitLabel: mode.value === 'edit' ? 'Guardar cambios' : 'Agregar',
    cancelLabel: 'Cancelar',
    sections: [
      {
        title: 'Información general',
        fields: [
          {
            key: 'cicloKpi',
            type: 'select',
            label: 'Ciclo KPI',
            placeholder: 'Selecciona un ciclo',
            options: ciclosOptions.value,
            rules: [required],
            size: 1,
          },
          {
            key: 'nombreKpi',
            type: 'text',
            label: 'Nombre KPI',
            placeholder: 'Ingresa un nombre',
            maxLength: 100,
            rules: [required],
            size: 1,
          },
          {
            key: 'unidadMedida',
            type: 'select',
            label: 'Unidad de medida',
            placeholder: 'Selecciona una opción',
            options: UNIDADES_OPTIONS,
            rules: [],
            size: 1,
          },
          {
            key: 'tipoCalculo',
            type: 'radio',
            label: 'Tipo de cálculo',
            default: 'ponderado',
            options: [
              {
                label: 'Ponderado',
                value: 'ponderado',
                description: 'La medición del KPI se contrasta con la meta configurada.',
              },
              {
                label: 'Directo',
                value: 'directo',
                description:
                  'KPI no requiere ningún tipo de cálculo y la medición representa el avance porcentual.',
              },
              {
                label: 'Tabla',
                value: 'tabla',
                description:
                  'Se establecen rangos de valores que resultan en un avance porcentual.',
              },
              {
                label: 'Función',
                value: 'funcion',
                description: 'Se establece una ecuación que resulte en el avance.',
              },
              {
                label: 'Indirecto',
                value: 'indirecto',
                description:
                  'Aquel en el que el desempeño mejora cuando el valor del indicador disminuye.',
              },
            ],
            rules: [required],
            size: 1,
          },
          {
            key: 'dependencia',
            type: 'radio',
            label: 'Dependencia',
            default: 'estandar',
            options: [
              { label: 'Estándar', value: 'estandar' },
              { label: 'Padre', value: 'padre' },
            ],
            rules: [required],
            size: 1,
          },
          {
            key: 'kpiPadre',
            type: 'select',
            label: 'KPI Padre',
            placeholder: 'Selecciona un KPI para asociar como padre',
            description: 'El KPI padre ya debe haber sido creado como padre.',
            options: (fd) =>
              (kpis?.value ?? [])
                .filter(
                  (k) =>
                    k.dependencia === 'padre' &&
                    k.cicloKpi === fd.cicloKpi &&
                    k.id !== kpiToEdit?.value?.id,
                )
                .map((k) => ({ label: k.nombreKpi, value: k.id })),
            rules: [],
            size: 1,
            visible: (fd) => fd.dependencia === 'estandar',
          },
          {
            key: 'kpiHijos',
            type: 'multiselect',
            label: 'KPI Hijo',
            placeholder: 'Selecciona un KPI para asociar como hijo',
            default: [],
            options: (fd) =>
              (kpis?.value ?? [])
                .filter((k) => k.dependencia === 'estandar' && k.cicloKpi === fd.cicloKpi)
                .map((k) => ({ label: k.nombreKpi, value: k.id })),
            rules: [],
            size: 1,
            visible: (fd) => fd.dependencia === 'padre',
          },
          {
            key: 'descripcionKpi',
            type: 'textarea',
            label: 'Descripción KPI',
            placeholder: 'Ingresa una descripción',
            maxLength: 100,
            rules: [],
            size: 1,
          },
          {
            key: 'estado',
            type: 'radio',
            label: 'Estado',
            default: 'activo',
            options: [
              { label: 'Activo', value: 'activo' },
              { label: 'Inactivo', value: 'inactivo' },
            ],
            rules: [required],
            size: 1,
          },
        ],
      },
      {
        title: 'Tipo de cálculo Tabla',
        description:
          'Donde se pueden establecer rangos de valores que resultan en un avance porcentual',
        card: true,
        visible: (fd) => fd.tipoCalculo === 'tabla',
        fields: [
          {
            key: '_rangosCount',
            type: 'number',
            label: 'Rangos',
            default: 2,
            min: 1,
            rules: [noNegative],
            size: 1,
            onChange: (v) => {
              rangosCount.value = Math.min(10, Math.max(1, Number(v) || 1))
            },
          },
          ...Array.from({ length: rangosCount.value }, (_, i) => [
            {
              key: `rango_minimo_${i}`,
              type: 'number',
              label: 'Valor mínimo',
              default: 0,
              min: 0,
              rules: [noNegative],
              size: '1/3',
            },
            {
              key: `rango_maximo_${i}`,
              type: 'number',
              label: 'Valor máximo',
              default: 0,
              min: 0,
              rules: [noNegative],
              size: '1/3',
            },
            {
              key: `rango_resultado_${i}`,
              type: 'percent',
              label: 'Resultado %',
              placeholder: 'ingresa %',
              rules: [required, noNegative],
              size: '1/3',
            },
          ]).flat(),
        ],
      },
      {
        title: 'Tipo de cálculo Función',
        description:
          'Donde se puede establecer una ecuación que resulte en el avance cuando ninguna de las opciones anteriores satisface la necesidad requerida.',
        card: true,
        visible: (fd) => fd.tipoCalculo === 'funcion',
        fields: [
          ...variableIndices.value.map((id) => ({
            key: `_var_group_${id}`,
            type: 'variable-group',
            size: 1,
            onDelete: () => removeVariable(id),
            copyToKey: 'funcionFormula',
            subFields: [
              {
                key: `variable_nombre_${id}`,
                type: 'text',
                label: 'Nombre variable',
                rules: [required],
              },
              {
                key: `variable_valor_prueba_${id}`,
                type: 'number',
                label: 'Valor de prueba',
                default: 1,
                min: 0,
                rules: [noNegative],
              },
            ],
          })),
          {
            key: '_add_variable',
            type: 'add-button',
            label: '+ Agregar variable',
            size: 1,
            onClick: addVariable,
          },
          {
            key: 'funcionFormula',
            type: 'textarea',
            label: 'Función',
            placeholder: 'ej: [Variable 1] + 2.5 * ( [KPI 1] ) ^ 4',
            description:
              'Usa los nombres de tus variables entre corchetes, ej: [Ventas] / [Meta]. Se permiten: suma +, resta -, multiplicación *, división /, asociación () y potencia ^',
            rules: [],
            validate: validateFuncionFormula,
            size: 1,
          },
          {
            key: 'resultadoPrueba',
            type: 'calc-result',
            label: 'Resultado prueba',
            rules: [],
            size: 1,
            calcDisabled: (fd) => !fd.funcionFormula,
          },
          {
            key: '_rangos_header',
            type: 'section-header',
            label: 'Rangos',
            description:
              'Es posible limitar los valores de entrada y de salida en los rangos que se requiera. El campo de tendencia decide que valor tendrá el dato que se sale de los rangos configurados.',
            size: 1,
          },
          {
            key: 'medicionMinima',
            type: 'number',
            label: 'Medición mínima',
            default: 1,
            min: 0,
            rules: [noNegative],
            size: '1/2',
          },

          {
            key: 'medicionMaxima',
            type: 'number',
            label: 'Medición máxima',
            default: 1,
            min: 0,
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'resultadoMinimo',
            type: 'number',
            label: 'Resultado mínimo',
            default: 1,
            min: 0,
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'resultadoMaximo',
            type: 'number',
            label: 'Resultado máximo',
            default: 1,
            min: 0,
            rules: [noNegative],
            size: '1/2',
          },
          {
            key: 'tendencia',
            type: 'radio',
            label: 'Tendencia',
            default: 'positiva',
            options: [
              { label: 'Positiva', value: 'positiva' },
              { label: 'Negativa', value: 'negativa' },
            ],
            rules: [],
            size: 1,
            inline: true,
          },
        ],
      },
    ],
  }))

  return { drawerConfig, mode, setMode, initVariables }
}
