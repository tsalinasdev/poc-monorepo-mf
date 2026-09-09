/**
 * Validadores para TFormField (Talanify). Cada función devuelve `true` si el
 * valor es válido, o un string con el mensaje de error. La firma es
 * uniforme para que las vistas las compongan con `validators: [...]`.
 */

type Validator = (v: unknown) => true | string

export const required: Validator = (v) =>
  (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) || 'Campo requerido'

export const minLength =
  (n: number): Validator =>
  (v) =>
    (typeof v === 'string' && v.length >= n) || `Mínimo ${n} caracteres`

export const maxLength =
  (n: number): Validator =>
  (v) =>
    typeof v !== 'string' || v.length <= n || `Máximo ${n} caracteres`

export const numeric: Validator = (v) =>
  v === '' || v == null || !isNaN(Number(v)) || 'Debe ser un número'

export const positiveNumber: Validator = (v) =>
  v === '' || v == null || Number(v) > 0 || 'Debe ser mayor a 0'

export const minValue =
  (n: number, msg?: string): Validator =>
  (v) =>
    v === null || v === '' || Number(v) >= n || (msg ?? `Mínimo ${n}`)

export const maxValue =
  (n: number, msg?: string): Validator =>
  (v) =>
    v === null || v === '' || Number(v) <= n || (msg ?? `Máximo ${n}`)
