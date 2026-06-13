const { FedaPay, Transaction } = require('fedapay');

// Configurer comme dans le code du projet
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const apiKey = process.env.FEDAPAY_SECRET_KEY || "sk_sandbox_placeholder";
FedaPay.setApiKey(apiKey);
FedaPay.setEnvironment('sandbox');

async function test() {
  try {
    console.log("Tentative de création de transaction FedaPay avec la clé:", apiKey);
    const customerParams = {
      firstname: "Ami",
      lastname: "MannaDaily",
      email: "test@mannadaily.app"
    };
    
    // Simulate empty phone number
    const cleanedPhone = "";
    if (cleanedPhone) {
      customerParams.phone_number = {
        number: cleanedPhone,
        country: 'BJ'
      };
    }

    const transaction = await Transaction.create({
      description: "Test d'achat de Streak Freeze MannaDaily [userId: 123]",
      amount: 500,
      currency: { iso: 'XOF' },
      callback_url: "http://localhost:3000/dashboard?status=verify&payment=freeze",
      customer: customerParams
    });

    console.log("Génération du token...");
    const token = await transaction.generateToken();
    console.log("Succès !", {
      id: transaction.id,
      url: token.url
    });
  } catch (error) {
    console.error("ERREUR:", error.message);
    if (error.response) {
      console.error("Détails de la réponse FedaPay:", error.response.data);
    } else {
      console.error("Erreur complète:", error);
    }
  }
}

test();
