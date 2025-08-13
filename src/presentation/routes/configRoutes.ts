import { Router } from 'express';
export const configRoutes = Router();

configRoutes.get('/', (req, res) => {
  res.json({ message: 'Config routes - Em desenvolvimento' });
});
