import { HttpCharacterRepository } from '@/modules/character/infrastructure/repositories/http-character.repository'
import { FindCharactersProps } from '@/modules/character/domain/props/find-characters.props'
import { FindCharacterProps } from '@/modules/character/domain/props/find-character.props'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import type { AxiosHttpClient } from '@/base/config/http/axios.http-client'

const get = vi.fn()
const httpClient = { get } as unknown as AxiosHttpClient
const repository = new HttpCharacterRepository(httpClient)

beforeEach(() => {
  get.mockReset()
})

it('maps the paginated list response to domain summaries', async () => {
  get.mockResolvedValue({
    data: {
      items: [
        {
          id: 1,
          name: 'Goku',
          image: 'goku.webp',
          race: 'Saiyan',
          affiliation: 'Z Fighter',
        },
      ],
      meta: { totalItems: 58, itemCount: 1, itemsPerPage: 20, totalPages: 3, currentPage: 1 },
    },
    status: 200,
    headers: {},
  })

  const result = await repository.findAll(new FindCharactersProps(1, 20))

  expect(get).toHaveBeenCalledWith('/characters?page=1&limit=20')
  expect(result.isOk()).toBe(true)
  expect(result.getValue().items[0]?.name).toBe('Goku')
  expect(result.getValue().total).toBe(58)
})

it('falls back to a placeholder for the nullable fields the API may omit', async () => {
  get.mockResolvedValue({
    data: {
      items: [{ id: 7, name: 'Nameless', image: 'x.webp', race: null, affiliation: null }],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
    },
    status: 200,
    headers: {},
  })

  const result = await repository.findAll(new FindCharactersProps(1, 20))

  expect(result.getValue().items[0]?.race).toBe('Unknown')
  expect(result.getValue().items[0]?.affiliation).toBe('Unknown')
})

it('maps a detail response to the domain entity, including its value objects', async () => {
  get.mockResolvedValue({
    data: {
      id: 1,
      name: 'Goku',
      image: 'goku.webp',
      race: 'Saiyan',
      gender: 'Male',
      affiliation: 'Z Fighter',
      ki: '60.000.000',
      maxKi: '90 Septillion',
      description: 'El protagonista.',
      originPlanet: { id: 2, name: 'Tierra', isDestroyed: false, image: 'tierra.webp' },
      transformations: [{ id: 1, name: 'Goku SSJ', image: 'ssj.webp', ki: '3 Billion' }],
    },
    status: 200,
    headers: {},
  })

  const result = await repository.findById(new FindCharacterProps(1))

  expect(result.isOk()).toBe(true)
  expect(result.getValue().originPlanet?.name).toBe('Tierra')
  expect(result.getValue().transformations[0]?.name).toBe('Goku SSJ')
})

// The API answers an unknown character with 400 "Character ID not found", not a
// 404. Normalising that quirk is the adapter's job — this test pins it down.
it('converts the API 400 "not found" into a domain CharacterNotFoundException', async () => {
  get.mockRejectedValue(new HttpServiceException(400, 'Character ID not found'))

  const result = await repository.findById(new FindCharacterProps(999))

  expect(result.isErr()).toBe(true)
  expect(result.getError().code).toBe('CHARACTER_NOT_FOUND')
})

it('keeps any other 400 as the generic http failure', async () => {
  get.mockRejectedValue(new HttpServiceException(400, 'Validation failed'))

  const result = await repository.findById(new FindCharacterProps(1))

  expect(result.getError().code).toBe('HTTP_SERVICE_ERROR')
})
