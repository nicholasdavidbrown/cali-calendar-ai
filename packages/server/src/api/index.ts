import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import calendarRoutes from '../routes/calendar';
import smsRoutes from '../routes/sms';
import userRoutes from '../routes/users';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/calendar', calendarRoutes);
router.use('/sms', smsRoutes);
router.use('/users', userRoutes);

export default router;
