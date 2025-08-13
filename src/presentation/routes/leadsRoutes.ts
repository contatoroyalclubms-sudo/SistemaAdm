import { Router } from 'express';
export const leadsRoutes = Router();

leadsRoutes.get('/', (req, res) => {
  res.json({ message: 'Leads routes - Em desenvolvimento' });
});
