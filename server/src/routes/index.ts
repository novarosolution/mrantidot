import { Router } from 'express';
import { authRouter } from './auth.routes';
import { uploadRouter } from './upload.routes';
import { servicesRouter } from './services.routes';
import { bookingsRouter } from './bookings.routes';
import { reviewsRouter } from './reviews.routes';
import { statsRouter } from './stats.routes';
import { adminRouter } from './admin.routes';
import { addressesRouter } from './addresses.routes';
import { paymentMethodsRouter } from './payment-methods.routes';
import { notificationsRouter } from './notifications.routes';
import { offersRouter } from './offers.routes';
import { contentRouter } from './content.routes';
import { techniciansRouter } from './technicians.routes';
import { attendanceRouter } from './attendance.routes';
import { leaveRouter } from './leave.routes';
import { websiteRouter } from './website.routes';
import { settingsRouter } from './settings.routes';
import { activityRouter } from './activity.routes';
import { broadcastRouter } from './broadcast.routes';
import { activityLog } from '../middleware/activityLog';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ message: 'Mr Antidot API v1' });
});

// Audit trail for every successful admin change below (written after the response is sent).
apiRouter.use(activityLog);

apiRouter.use('/auth', authRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/services', servicesRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/stats', statsRouter);
// Before the general admin router so these sub-paths reach their own routers.
apiRouter.use('/admin/activity', activityRouter);
apiRouter.use('/admin/broadcast', broadcastRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/payment-methods', paymentMethodsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/offers', offersRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/technicians', techniciansRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/leave', leaveRouter);
apiRouter.use('/website', websiteRouter);
apiRouter.use('/settings', settingsRouter);
