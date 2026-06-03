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

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ message: 'Mr Antidot API v1' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/services', servicesRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/payment-methods', paymentMethodsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/offers', offersRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/technicians', techniciansRouter);
apiRouter.use('/attendance', attendanceRouter);
