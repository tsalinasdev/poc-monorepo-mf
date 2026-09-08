import { vi } from 'vitest'
import { httpGet, ApiError, NotFoundError } from '@/modules/shared/api/http'
import { getCharacter, getCharacters } from '@/modules/character/services/characters.services'
import {
  buildApiCharacter,
  buildApiCharacterItem,
  buildApiCharacterList,
} from '../builders/character.builders'

vi.mock('@/modules/shared/api/http', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  httpGet: vi.fn(),
}))

const mockedGet = vi.mocked(httpGet)

beforeEach(() => {
  mockedGet.mockReset()
})

describe('getCharacters', () => {
  it('requests the paginated list and maps it to cards', async () => {
    mockedGet.mockResolvedValue(buildApiCharacterList())

    const page = await getCharacters(1, 20)

    expect(mockedGet).toHaveBeenCalledWith('/characters?page=1&limit=20')
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.name).toBe('Goku')
    expect(page.total).toBe(58)
  })

  it('falls back to a placeholder for the nullable fields the API may omit', async () => {
    mockedGet.mockResolvedValue(
      buildApiCharacterList({
        items: [
          buildApiCharacterItem({
            id: 7,
            name: 'Nameless',
            image: 'x.webp',
            race: null,
            affiliation: null,
          }),
        ],
        meta: { totalItems: 1, itemCount: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
      }),
    )

    const page = await getCharacters(1, 20)

    expect(page.items[0]?.race).toBe('Unknown')
    expect(page.items[0]?.affiliation).toBe('Unknown')
  })
})

describe('getCharacter', () => {
  it('requests the detail and maps it, including origin planet and transformations', async () => {
    mockedGet.mockResolvedValue(buildApiCharacter())

    const detail = await getCharacter(1)

    expect(mockedGet).toHaveBeenCalledWith('/characters/1')
    expect(detail.originPlanet?.name).toBe('Tierra')
    expect(detail.originPlanet?.statusLabel).toBe('Intact')
    expect(detail.transformations[0]?.name).toBe('Goku SSJ')
    expect(detail.kiLabel).toBe('Ki 60.000.000')
  })

  it('leaves a destroyed planet explicitly labelled', async () => {
    mockedGet.mockResolvedValue(
      buildApiCharacter({
        originPlanet: { name: 'Planet Vegeta', isDestroyed: true, image: 'vegeta.webp' },
      }),
    )

    const detail = await getCharacter(1)

    expect(detail.originPlanet?.statusLabel).toBe('Destroyed')
  })

  // The API answers an unknown character with 400 "Character ID not found",
  // not a 404. Normalising that quirk is this service's job — pinned here.
  it('converts the API 400 "not found" quirk into a NotFoundError', async () => {
    mockedGet.mockRejectedValue(new ApiError('Character ID not found', 400))

    await expect(getCharacter(999)).rejects.toThrow(NotFoundError)
  })

  it('keeps any other API failure as-is', async () => {
    mockedGet.mockRejectedValue(new ApiError('Validation failed', 400))

    await expect(getCharacter(1)).rejects.toThrow('Validation failed')
  })
})
