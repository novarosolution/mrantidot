import { Router } from 'express';
import { Offer, isOfferCurrentlyValid } from '../models/Offer';
import { asyncHandler } from '../middleware/error';

export const offersRouter = Router();

offersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const offers = await Offer.find({ active: true }).sort({ discount: -1 });
    const visible = offers.filter((o) => isOfferCurrentlyValid(o));
    res.json({ offers: visible.map((o) => o.toJSON()) });
  }),
);
