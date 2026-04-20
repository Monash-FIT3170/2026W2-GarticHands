import { Router } from 'express'
import Submission from '../models/Submission.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdAt: -1 }).lean().exec()
    return res.json(submissions)
  } catch (err) {
    console.error('Error fetching submissions', err)
    return res.status(500).json({ error: 'Failed to load submissions' })
  }
})

router.post('/', async (req, res) => {
  const submission = req.body?.submission

  if (typeof submission !== 'string' || submission.trim().length === 0) {
    return res.status(400).json({ error: 'submission must be a non-empty string' })
  }

  try {
    const doc = await Submission.create({ content: submission.trim() })
    return res.status(201).json(doc)
  } catch (err) {
    console.error('Error saving submission', err)
    return res.status(500).json({ error: 'Failed to save submission' })
  }
})

export default router

