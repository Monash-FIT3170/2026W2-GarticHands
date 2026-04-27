import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

import createSubmissionsRouter from '../routes/submission.js'

describe('GET /api/submissions', () => {
  it('returns a submissions array', async () => {
    const mockSubmissionModel = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            _id: '1',
            content: 'hello',
            createdAt: '2026-04-23T18:54:08.786Z',
          },
        ]),
      }),
    }

    const app = express()
    app.use(express.json())
    app.use('/api/submissions', createSubmissionsRouter(mockSubmissionModel))

    const response = await request(app).get('/api/submissions')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.submissions[0].content).toBe('hello')
  })
})