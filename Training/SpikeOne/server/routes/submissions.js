import { Router } from 'express'

const router = Router()

router.post('/', (req, res) => {
  const submission = req.body?.submission

  if (typeof submission !== 'string' || submission.trim().length === 0) {
    return res.status(400).json({ error: 'submission must be a non-empty string' })
  }

  console.log('New submission:', submission)

  return res.status(201).json({ ok: true })
})

export default router

