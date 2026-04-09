import { Router } from 'express'
import Submission from '../models/Submission.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const results = await Submission.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]).exec()

    return res.json({ submissions_per_day: results })
  } catch (err) {
    console.error('Error generating stats', err)
    return res.status(500).json({ error: 'Failed to generate stats' })
  }
})

export default router

