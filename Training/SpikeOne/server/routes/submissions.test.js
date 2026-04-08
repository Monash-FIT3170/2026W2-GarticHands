import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
process.env.NODE_ENV = 'test'

vi.mock('../models/Submission.js', () => {
  return {
    default: {
      find: vi.fn(),
    },
  }
})

describe('GET /api/submissions', () => {
  it('returns an array (passes)', async () => {
    const { default: Submission } = await import('../models/Submission.js')
    Submission.find.mockReturnValueOnce({
      sort: () => ({
        lean: () => ({
          exec: async () => [],
        }),
      }),
    })

    const { app } = await import('../index.js')
    const res = await request(app).get('/api/submissions')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('returns newest first (intentional fail, then fixed)', async () => {
    const { default: Submission } = await import('../models/Submission.js')
    Submission.find.mockReturnValueOnce({
      sort: () => ({
        lean: () => ({
          exec: async () => [
            { _id: 'newer-id', content: 'newer', createdAt: '2021-01-01T00:00:00.000Z' },
            { _id: 'older-id', content: 'older', createdAt: '2020-01-01T00:00:00.000Z' },
          ],
        }),
      }),
    })

    const { app } = await import('../index.js')
    const res = await request(app).get('/api/submissions')
    expect(res.status).toBe(200)
    expect(res.body[0]._id).toBe('newer-id')
    expect(res.body[1]._id).toBe('older-id')
  })
})

