import { Service } from '../models/Service';
import { defaultServiceContent } from '../constants/serviceContentDefaults';

/**
 * Local/demo databases created before services had detail content get starter content once.
 * Only touches services that have never had the field (an admin clearing it leaves an empty
 * array, which is left alone). Never runs in production — real sizes and prices are the admin's call.
 */
export async function backfillServiceContent(): Promise<number> {
  if (process.env.NODE_ENV === 'production') return 0;
  const missing = await Service.find({ included: { $exists: false } })
    .select('serviceTypes category basePrice')
    .lean();
  for (const s of missing) {
    await Service.updateOne(
      { _id: s._id, included: { $exists: false } },
      { $set: defaultServiceContent({ serviceTypes: s.serviceTypes, category: s.category, basePrice: s.basePrice }) },
    );
  }
  if (missing.length > 0) console.log(`[services] Added starter detail content to ${missing.length} service(s)`);
  return missing.length;
}
