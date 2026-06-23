import { FedaPay, Transaction } from 'fedapay'

// Fonction d'initialisation dynamique de FedaPay (évite les problèmes de cache de variables d'env)
function initFedaPay() {
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  const apiKey = process.env.FEDAPAY_SECRET_KEY || "sk_sandbox_placeholder";
  FedaPay.setApiKey(apiKey);
  FedaPay.setEnvironment('sandbox'); // mode sandbox par défaut pour la sécurité et les tests
}

export interface CreateTransactionResult {
  transactionId: number
  paymentUrl: string
}

export interface VerifyTransactionResult {
  status: string
  amount: number
  customer: {
    email?: string
    firstname?: string
    lastname?: string
    phone?: string
  }
  metadata?: Record<string, any>
}

/**
 * Crée une transaction de paiement dans FedaPay (Sandbox ou Production)
 */
export async function createTransaction(
  amount: number,
  description: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  callbackUrl: string,
  metadata?: Record<string, any>
): Promise<CreateTransactionResult> {
  try {
    initFedaPay()
    const names = customerName.trim().split(/\s+/)
    const firstname = names[0] || "Ami"
    const lastname = names.slice(1).join(" ") || "MannaDaily"

    // Nettoyage sommaire du numéro de téléphone
    const cleanedPhone = customerPhone.replace(/[\s\-\+\(\)]/g, "")

    const customerParams: any = {
      firstname,
      lastname,
      email: customerEmail.toLowerCase().trim()
    }

    if (cleanedPhone) {
      customerParams.phone_number = {
        number: cleanedPhone,
        country: 'BJ' // Bénin par défaut pour l'Afrique de l'Ouest
      }
    }

    const transaction = await Transaction.create({
      description,
      amount,
      currency: { iso: 'XOF' },
      callback_url: callbackUrl,
      customer: customerParams,
      metadata: metadata || {}
    })

    const token = await transaction.generateToken()

    return {
      transactionId: transaction.id,
      paymentUrl: token.url
    }
  } catch (error: unknown) {
    console.error("Erreur lors de la creation de la transaction FedaPay:", error)
    throw new Error(
      error instanceof Error ? error.message : "Impossible de creer la transaction de paiement."
    )
  }
}

/**
 * Recupere et verifie le statut d'une transaction FedaPay
 */
export async function verifyTransaction(transactionId: string | number): Promise<VerifyTransactionResult> {
  try {
    initFedaPay()
    const id = typeof transactionId === "string" ? parseInt(transactionId, 10) : transactionId
    if (isNaN(id)) {
      throw new Error("ID de transaction invalide")
    }

    const transaction = await Transaction.retrieve(id)
    
    const status = transaction.status || "unknown"
    const amount = transaction.amount || 0
    
    const customer = transaction.customer || {}
    const phone_number = customer.phone_number || {}

    return {
      status,
      amount,
      customer: {
        email: customer.email,
        firstname: customer.firstname,
        lastname: customer.lastname,
        phone: phone_number.number
      },
      metadata: transaction.metadata || {}
    }
  } catch (error: unknown) {
    console.error("Erreur lors de la verification de la transaction FedaPay:", error)
    throw new Error(
      error instanceof Error ? error.message : "Impossible de verifier la transaction de paiement."
    )
  }
}
