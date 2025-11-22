import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import calendarRoutes from '../routes/calendar';
import smsRoutes from '../routes/sms';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/calendar', calendarRoutes);
router.use('/sms', smsRoutes);

export default router;
