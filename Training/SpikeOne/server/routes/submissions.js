import { Router } from 'express'

const router = Router()

router.post('/', (req, res) => {
  const { text } = req.body
  console.log('Received submission:', text)
  res.json({ success: true, received: text })
})

export default router