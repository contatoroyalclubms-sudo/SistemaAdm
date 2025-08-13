import { Router } from 'express';
export const webhookRoutes = Router();

webhookRoutes.post('/stripe', (req, res) => {
  res.json({ message: 'Stripe webhook - Em desenvolvimento' });
});

webhookRoutes.post('/pix', (req, res) => {
  res.json({ message: 'PIX webhook - Em desenvolvimento' });
});
