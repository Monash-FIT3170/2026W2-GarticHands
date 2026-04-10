import { Router } from 'express'
import Submission from '../models/Submission.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const submission = new Submission({ content: req.body.text })
    await submission.save()
    console.log('Saved submission:', submission)
    res.json({ success: true, received: req.body.text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to save' })
  }
})

router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 })
    res.json(submissions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' })
  }
})

export default router