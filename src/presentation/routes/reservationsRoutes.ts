import { Router } from 'express';
export const reservationsRoutes = Router();

reservationsRoutes.get('/', (req, res) => {
  res.json({ message: 'Reservations routes - Em desenvolvimento' });
});
