interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  blockchainAccountId: string;
}

interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DIDDocument {
  "@context": string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  service?: Service[];
  created: string;
  updated: string;
  isAIAgent?: boolean;
  creator?: string;
}

export class DIDDocumentCreator {
  private static readonly CONTEXT = [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/secp256k1-2019/v1",
  ];

  static createDIDDocument(
    address: string,
    isAIAgent: boolean = false,
    creator?: string
  ): DIDDocument {
    if (isAIAgent && !creator) {
      throw new Error(
        "Creator address is required for AI agent DID documents"
      );
    }

    const timestamp = new Date().toISOString();
    const did = `did:zynd:${isAIAgent ? "agent" : "user"}:${address.toLowerCase()}`;

    const verificationMethod: VerificationMethod = {
      id: `${did}#key-1`,
      type: "EcdsaSecp256k1RecoveryMethod2020",
      controller: did,
      blockchainAccountId: `eip155:1:${address.toLowerCase()}`,
    };

    const didDocument: DIDDocument = {
      "@context": this.CONTEXT,
      id: did,
      controller: isAIAgent
        ? `did:zynd:user:${creator!.toLowerCase()}`
        : did,
      verificationMethod: [verificationMethod],
      authentication: [`${did}#key-1`],
      created: timestamp,
      updated: timestamp,
      isAIAgent: isAIAgent,
    };

    if (isAIAgent) {
      didDocument.creator = creator;
      didDocument.assertionMethod = [`${did}#key-1`];
    }

    if (isAIAgent) {
      didDocument.service = [
        {
          id: `${did}#ai-service`,
          type: "AIService",
          serviceEndpoint: `https://api.zynd.ai/agents/${address.toLowerCase()}`,
        },
        {
          id: `${did}#messaging`,
          type: "MessagingService",
          serviceEndpoint: `https://messaging.zynd.ai/agents/${address.toLowerCase()}`,
        },
      ];
    } else {
      didDocument.service = [
        {
          id: `${did}#profile`,
          type: "ProfileService",
          serviceEndpoint: `https://profiles.zynd.ai/users/${address.toLowerCase()}`,
        },
      ];
    }

    return didDocument;
  }

  static updateDIDDocument(
    existingDocument: DIDDocument,
    updates: Partial<DIDDocument>
  ): DIDDocument {
    const updatedDocument = {
      ...existingDocument,
      ...updates,
      updated: new Date().toISOString(),
    };

    updatedDocument.id = existingDocument.id;
    updatedDocument.created = existingDocument.created;
    updatedDocument.isAIAgent = existingDocument.isAIAgent;
    updatedDocument.creator = existingDocument.creator;

    return updatedDocument;
  }

  static validateDIDDocument(document: DIDDocument): boolean {
    if (!document.id || !document.controller || !document.verificationMethod) {
      throw new Error("Missing required DID document fields");
    }

    if (!document.id.startsWith("did:zynd:")) {
      throw new Error("Invalid DID format");
    }

    if (document.verificationMethod.length === 0) {
      throw new Error("At least one verification method is required");
    }

    if (!document.authentication || document.authentication.length === 0) {
      throw new Error("At least one authentication method is required");
    }

    if (document.isAIAgent) {
      if (!document.creator) {
        throw new Error("Creator is required for AI agent DID documents");
      }
      if (!document.controller.startsWith("did:zynd:user:")) {
        throw new Error("AI agent must be controlled by a user DID");
      }
    }

    return true;
  }
}
