import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    message: 'Hello from your local Express backend!',
  })
})

export default router

