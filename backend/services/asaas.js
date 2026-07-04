// Para garantir compatibilidade com o Node no Render, usaremos o fetch nativo global:

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

const asaasHeaders = {
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY
};

/**
 * Cria ou recupera um cliente no Asaas
 */
async function createOrGetCustomer(nome, email, cpfCnpj = null) {
  if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

  // Primeiro busca para ver se o cliente já existe pelo email
  const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
    method: 'GET',
    headers: asaasHeaders
  });
  
  if (!searchRes.ok) throw new Error('Falha ao buscar cliente no Asaas');
  const searchData = await searchRes.json();
  
  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id; // Retorna o ID do cliente existente
  }

  // Se não existe, cria um novo
  const body = {
    name: nome,
    email: email
  };
  
  if (cpfCnpj) {
    body.cpfCnpj = cpfCnpj;
  }

  const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: asaasHeaders,
    body: JSON.stringify(body)
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error('Falha ao criar cliente no Asaas: ' + JSON.stringify(errorData));
  }
  
  const createData = await createRes.json();
  return createData.id;
}

/**
 * Cria uma cobrança (mensalidade)
 */
async function createPayment(customerId, value, dueDate, description) {
  if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

  const body = {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    dueDate: dueDate,
    description: description
  };

  const res = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: asaasHeaders,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error('Falha ao criar cobrança no Asaas: ' + JSON.stringify(errorData));
  }

  const paymentData = await res.json();
  return paymentData;
}

/**
 * Recupera o QR Code de uma cobrança PIX
 */
async function getPixQRCode(paymentId) {
  if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

  const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: asaasHeaders
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error('Falha ao obter QR Code do PIX no Asaas: ' + JSON.stringify(errorData));
  }

  const qrCodeData = await res.json();
  return qrCodeData;
}

/**
 * Cria uma assinatura (cobrança recorrente mensal)
 */
async function createSubscription(customerId, value, nextDueDate, description) {
  if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

  const body = {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    nextDueDate: nextDueDate,
    cycle: 'MONTHLY',
    description: description
  };

  const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: asaasHeaders,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error('Falha ao criar assinatura no Asaas: ' + JSON.stringify(errorData));
  }

  const subData = await res.json();
  return subData;
}

module.exports = {
  createOrGetCustomer,
  createPayment,
  getPixQRCode,
  createSubscription
};
