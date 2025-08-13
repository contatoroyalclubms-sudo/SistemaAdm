const fs = require('fs-extra');
const path = require('path');
const PIXService = require('./pix-asaas');

const cfgDir = path.resolve(__dirname, '../../config');

function loadJSON(file){
  const p = path.join(cfgDir, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const menus = () => loadJSON('menus.json') || {};
const products = () => loadJSON('products.json') || { items: [] };

// caminho das imagens
const IMG = {
  flyer: path.resolve('./storage/royal/mc-daniel-flyer.png'),
  mapa:  path.resolve('./storage/royal/mapa-camarotes.png'),
  logo:  path.resolve('./storage/royal/royal-logo.png')
};

// link oficial de venda
const SALES_LINK = 'https://links.totalingressos.com/mc-daniel-na-royal.html';

function intent(t){
  const s = (t || '').trim().toLowerCase();
  if (/menu|op(c|ç)oes|ajuda|iniciar/.test(s)) return 'menu';
  if (/vip|lista/.test(s)) return 'vip';
  if (/ingress|ticket|comprar|convite/.test(s)) return 'ingresso';
  if (/anivers/.test(s)) return 'aniversario';
  if (/local|end(e|)re(c|ç)o|mapa/.test(s)) return s.includes('mapa') ? 'mapa' : 'local';
  if (/camarote/.test(s)) return 'camarote';
  if (/promoter|promo/.test(s)) return 'promoter';
  if (/comprovante/.test(s)) return 'comprovante';
  return 'fallback';
}

async function handleIncoming({ from, text, sock }){
  const i = intent(text);
  const club = process.env.CLUB_NAME || 'Royal Club';
  switch(i){
    case 'menu': {
      const m = menus();
      const lines = [
        `✨ *${club}*`,
        ...(m.menu || [
          '🎤 MC Daniel — 16 AGO (Sáb) 22h',
          '1) Ingressos',
          '2) Mapa/Camarotes',
          '3) Lista/VIP',
          '4) Aniversariante',
          '5) Localização'
        ]),
        'Diga: ingresso | mapa | camarote | vip | aniversario | local'
      ];
      // manda flyer + legenda do menu
      if (fs.existsSync(IMG.flyer)) {
        await sock.sendMessage(from, { image: { url: IMG.flyer }, caption: lines.join('\n') });
        return;
      }
      return lines.join('\n');
    }

    case 'ingresso': {
      const prod = products().items?.find(x => x.slug === 'ingresso-unissex') || { name:'Ingresso Unissex', price:60 };
      const caption = `🎟 *${prod.name}*: R$ ${Number(prod.price).toFixed(2)}\nCompre pelo link oficial:\n${SALES_LINK}\nApós o pagamento, envie "COMPROVANTE".`;
      if (fs.existsSync(IMG.logo)) {
        await sock.sendMessage(from, { image: { url: IMG.logo }, caption });
        return;
      }
      return caption;
    }

    case 'mapa':
    case 'camarote': {
      const caption = '🗺 *Mapa de Camarotes e Bistrô*\nFaça sua reserva pelo atendimento ou compre o ingresso no link oficial.\n' + SALES_LINK;
      if (fs.existsSync(IMG.mapa)) {
        await sock.sendMessage(from, { image: { url: IMG.mapa }, caption });
        return;
      }
      return caption;
    }

    case 'vip':
      return '📝 *Lista/VIP*\nEnvie: "VIP NOME RG 00.000.000-0". Confirmação sai em até 5min.';

    case 'aniversario':
      return '🎉 *Aniversariante*: Mín. 10 pagantes → bolo + área reservada. Responda "PROMO ANIVER" para falar com atendente.';

    case 'local':
      return '📍 Royal Club — Rua Arquiteto Rubens Gil de Camilo, 20.\nMapa: https://maps.google.com/?q=-20.467,-54.620';

    case 'promoter':
      return '👤 *Promoter*: Envie "PROMO CÓDIGO-DO-PROMOTER" para garantir desconto e ranking.';

    case 'comprovante':
      return '✅ Comprovante recebido! Assim que confirmado, enviamos sua liberação.';

    default:
      if (/^vip\s+/i.test(text)){
        // TODO: Implementar saveVipEntry
        return '✅ Recebido! Processando sua entrada VIP. Aguarde confirmação.';
      }
      return 'Digite *menu* para ver: ingresso, mapa, camarote, vip, aniversario, local.';
  }
}

module.exports = {
  handleIncoming,
  intent,
  menus,
  products
};
