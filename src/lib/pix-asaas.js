/**
 * PIX Payment Service - Asaas Implementation
 * 
 * Real implementation using Asaas payment provider
 */

const fetch = require('node-fetch');

class PIXAsaasService {
  constructor() {
    this.provider = 'ASAAS';
    this.apiKey = process.env.ASAAS_API_KEY;
    this.baseUrl = process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3';
    this.webhookUrl = process.env.PIX_WEBHOOK_URL || 'http://localhost:8080/webhook/pix';
    
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY environment variable is required');
    }
  }

  /**
   * Generate PIX payment link
   * @param {string} customerPhone - Customer phone number
   * @param {string} productId - Product identifier
   * @param {number} amount - Payment amount in BRL
   * @returns {Promise<string>} Payment link URL
   */
  async generatePaymentLink(customerPhone, productId, amount) {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerPhone,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          description: `${productId} - Royal Club`,
          externalReference: `royal_${Date.now()}`,
          notificationUrl: this.webhookUrl
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Asaas API error: ${error}`);
      }

      const payment = await response.json();
      return payment.invoiceUrl;
    } catch (error) {
      console.error('Error generating Asaas payment:', error);
      throw error;
    }
  }

  /**
   * Generate PIX QR Code
   * @param {string} customerPhone - Customer phone number
   * @param {string} productId - Product identifier
   * @param {number} amount - Payment amount in BRL
   * @returns {Promise<Object>} QR Code data and PIX key
   */
  async generatePixQR(customerPhone, productId, amount) {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customerPhone,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          description: `${productId} - Royal Club`,
          externalReference: `royal_${Date.now()}`,
          notificationUrl: this.webhookUrl
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Asaas API error: ${error}`);
      }

      const payment = await response.json();
      
      return {
        paymentId: payment.id,
        qrCode: payment.pixQrCode?.encodedImage || null,
        pixKey: payment.pixQrCode?.payload || null,
        amount: payment.value,
        expiresAt: payment.dueDate
      };
    } catch (error) {
      console.error('Error generating Asaas PIX QR:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   * @param {string} paymentId - Payment ID to check
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'access_token': this.apiKey
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Asaas API error: ${error}`);
      }

      const payment = await response.json();
      
      return {
        id: payment.id,
        status: payment.status, // 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'RECEIVED_IN_CASH', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED', 'AWAITING_RISK_ANALYSIS'
        paidAt: payment.paymentDate,
        amount: payment.value,
        pixKey: payment.pixQrCode?.payload || null
      };
    } catch (error) {
      console.error('Error checking Asaas payment status:', error);
      throw error;
    }
  }

  /**
   * Process PIX webhook
   * @param {Object} webhookData - Webhook payload from Asaas
   * @returns {Promise<Object>} Processed payment data
   */
  async processWebhook(webhookData) {
    try {
      console.log('Asaas webhook received:', webhookData);
      
      const { event, payment } = webhookData;
      
      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        return {
          paymentId: payment.id,
          status: 'paid',
          amount: payment.value,
          customerPhone: payment.customer,
          processed: true,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        paymentId: payment?.id || 'unknown',
        status: event?.toLowerCase() || 'unknown',
        processed: false
      };
    } catch (error) {
      console.error('Error processing Asaas webhook:', error);
      throw error;
    }
  }

  /**
   * Create customer in Asaas
   * @param {Object} customerData - Customer information
   * @returns {Promise<string>} Customer ID
   */
  async createCustomer(customerData) {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customerData.name,
          cpfCnpj: customerData.cpfCnpj,
          email: customerData.email,
          phone: customerData.phone,
          mobilePhone: customerData.phone
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Asaas API error: ${error}`);
      }

      const customer = await response.json();
      return customer.id;
    } catch (error) {
      console.error('Error creating Asaas customer:', error);
      throw error;
    }
  }

  /**
   * Validate PIX key format
   * @param {string} pixKey - PIX key to validate
   * @returns {boolean} True if valid
   */
  validatePixKey(pixKey) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+55\d{10,11}$/;
    const cpfRegex = /^\d{11}$/;
    const cnpjRegex = /^\d{14}$/;
    const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

    return emailRegex.test(pixKey) || 
           phoneRegex.test(pixKey) || 
           cpfRegex.test(pixKey) || 
           cnpjRegex.test(pixKey) || 
           randomKeyRegex.test(pixKey);
  }
}

module.exports = PIXAsaasService;
