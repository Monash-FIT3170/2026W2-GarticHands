const express = require('express')
const router = express.Router()
const Submission = require('../models/Submission')

router.get('/', async (req, res) => {
  try {
    const stats = await Submission.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ])

    res.json({ submissions_per_day: stats })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router