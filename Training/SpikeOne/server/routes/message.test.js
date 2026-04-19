import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import messageRouter from './message.js'

const app = express()
app.use('/api/message', messageRouter)

describe('GET /api/message', () => {
  it('returns a 200 status', async () => {
    const res = await request(app).get('/api/message')
    expect(res.status).toBe(200)
  })

  it('returns a JSON object with a message property', async () => {
    const res = await request(app).get('/api/message')
    expect(res.body).toHaveProperty('message')
    expect(typeof res.body.message).toBe('string')
  })

  it('does not return an empty message', async () => {
    const res = await request(app).get('/api/message')
    expect(res.body.message.length).toBeGreaterThan(0)
  })
})