require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

async function test() {
  const client = new MercadoPagoConfig({ accessToken: 'APP_USR-7145184816670434-110113-5a0224df61b0f69f2ea69d2a67772e0b-160769628' }); // Fake valid format
  const preference = new Preference(client);
  try {
    await preference.create({
      body: {
        items: [{ id: '123', title: 'Test', quantity: 1, unit_price: 10, currency_id: 'BRL' }]
      }
    });
  } catch(e) {
    console.log(e);
  }
}
test();
