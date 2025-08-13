import { Router } from 'express';
export const eventsRoutes = Router();

eventsRoutes.get('/', (req, res) => {
  res.json({ message: 'Events routes - Em desenvolvimento' });
});
