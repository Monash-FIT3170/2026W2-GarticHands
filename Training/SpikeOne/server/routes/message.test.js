import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../app.js'

describe('GET /api/message', () => {
  it('returns a message', async () => {
    const res = await request(app).get('/api/message')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('message')
  })

  // intentionally failing — fix by checking the actual message value
  it('returns the correct message text', async () => {
    const res = await request(app).get('/api/message')
    expect(res.body.message).toBe('Hello from the Express backend!')
  })
})