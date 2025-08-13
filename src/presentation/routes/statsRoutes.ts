import { Router } from 'express';
export const statsRoutes = Router();

statsRoutes.get('/leads', (req, res) => {
  res.json({ message: 'Lead stats - Em desenvolvimento' });
});

statsRoutes.get('/reservations', (req, res) => {
  res.json({ message: 'Reservation stats - Em desenvolvimento' });
});

statsRoutes.get('/revenue', (req, res) => {
  res.json({ message: 'Revenue stats - Em desenvolvimento' });
});
