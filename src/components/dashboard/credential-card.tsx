"use client";

import { useState, useEffect } from "react";
import { Copy, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";

const formatDID = (did: string): string => {
  if (!did) return "";
  if (did.length <= 20) return did;
  return `${did.slice(0, 10)}...${did.slice(-10)}`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return (
      date.toISOString().split("T")[0] +
      " " +
      date.toTimeString().split(" ")[0].slice(0, 5)
    );
  } catch {
    return "Invalid Date";
  }
};

type CredentialStatus = "active" | "expired" | "revoked";

const getCredentialStatus = (
  revoked: boolean,
  expirationDate: string
): CredentialStatus => {
  if (revoked) return "revoked";
  if (expirationDate && new Date() > new Date(expirationDate)) return "expired";
  return "active";
};

const STATUS_CONFIG: Record<
  CredentialStatus,
  {
    gradient: string;
    icon: typeof ShieldCheck;
    iconColor: string;
    badgeVariant: "active" | "inactive" | "deprecated";
    text: string;
  }
> = {
  active: {
    gradient: "from-[#8B5CF6]/20 to-[#8B5CF6]/5",
    icon: ShieldCheck,
    iconColor: "text-[#8B5CF6]",
    badgeVariant: "active",
    text: "Active",
  },
  expired: {
    gradient: "from-yellow-500/20 to-yellow-500/5",
    icon: ShieldAlert,
    iconColor: "text-yellow-400",
    badgeVariant: "inactive",
    text: "Expired",
  },
  revoked: {
    gradient: "from-red-500/20 to-red-500/5",
    icon: ShieldX,
    iconColor: "text-red-400",
    badgeVariant: "deprecated",
    text: "Revoked",
  },
};

interface CredentialData {
  id: string;
  revoked: boolean;
  vc: {
    expirationDate: string;
    issuanceDate: string;
    credentialSubject: string;
    issuer: string;
    type: string;
    didIdentifier: string;
  };
}

interface CredentialCardProps {
  credential: unknown;
  index: number;
  isDID: boolean;
}

export function CredentialCard({
  credential,
  index,
  isDID,
}: CredentialCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [credData, setCredData] = useState<CredentialData | null>(null);

  useEffect(() => {
    if (!credential) return;

    const cred = credential as Record<string, unknown> & { id?: string; revoked?: boolean; vc?: Record<string, unknown>; issuanceDate?: string; issuer?: string };
    let processedData: CredentialData;

    if (isDID) {
      processedData = {
        id: cred.id as string,
        revoked: false,
        vc: {
          expirationDate: "",
          issuanceDate: cred.issuanceDate as string,
          credentialSubject: "DID Document",
          issuer: cred.issuer as string,
          type: "DID Document",
          didIdentifier: cred.issuer as string,
        },
      };
    } else {
      const vc = cred.vc as Record<string, unknown>;
      const subject = vc.credentialSubject as Record<string, unknown>;
      processedData = {
        id: cred.id as string,
        revoked: cred.revoked as boolean,
        vc: {
          expirationDate: vc.expirationDate as string,
          issuanceDate: vc.issuanceDate as string,
          credentialSubject: subject.type as string,
          issuer: vc.issuer as string,
          type: subject.type as string,
          didIdentifier: subject.owner as string,
        },
      };
    }

    setCredData(processedData);
  }, [credential, isDID]);

  if (!credData) {
    return (
      <div className="h-48 w-full animate-pulse rounded-lg bg-white/5" />
    );
  }

  const status = getCredentialStatus(
    credData.revoked,
    credData.vc.expirationDate
  );
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const handleCopyDID = () => {
    navigator.clipboard.writeText(credData.vc.didIdentifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
  };

  return (
    <>
      <div className={`group w-full rounded-lg border border-white/10 bg-gradient-to-br ${config.gradient} p-3 sm:p-5 transition-all hover:-translate-y-0.5 hover:border-white/20`}>
        <div className="mb-4 flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${config.iconColor}`} />
          <h3 className="text-base font-semibold text-[#E0E7FF]">
            {credData.vc.type}
          </h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="min-w-0">
            <span className="block text-xs text-[#E0E7FF]/40">Issuer</span>
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-mono text-xs sm:text-sm text-[#E0E7FF]/80">
                {formatDID(credData.vc.issuer)}
              </span>
              <button
                onClick={handleCopyDID}
                className="cursor-pointer rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <Copy
                  className={`h-3.5 w-3.5 ${copied ? "text-[#8B5CF6]" : "text-[#E0E7FF]/40"}`}
                />
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <span className="block text-xs text-[#E0E7FF]/40">Issued To</span>
            <span className="block truncate font-mono text-xs sm:text-sm text-[#E0E7FF]/80">
              {formatDID(credData.vc.didIdentifier)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-xs text-[#E0E7FF]/40">
                Issued At
              </span>
              <span className="text-[#E0E7FF]/80">
                {formatDate(credData.vc.issuanceDate)}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#E0E7FF]/40">
                Valid Until
              </span>
              <span className="text-[#E0E7FF]/80">
                {isDID ? "-" : formatDate(credData.vc.expirationDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant={config.badgeVariant}>{config.text}</Badge>
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="cursor-pointer rounded border border-white/10 px-3 py-1.5 min-h-[44px] text-xs text-[#E0E7FF]/60 transition-colors hover:bg-white/5 hover:text-[#E0E7FF]"
          >
            View Details
          </button>
        </div>
      </div>

      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Credential Details"
        className="max-w-4xl"
      >
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleCopyJSON}
            className="flex cursor-pointer items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#E0E7FF]/60 transition-colors hover:text-[#E0E7FF]"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy JSON
          </button>
        </div>
        <pre className="max-h-[60vh] overflow-auto rounded-lg bg-white/5 p-2 sm:p-4 text-[10px] sm:text-xs text-[#E0E7FF]/80">
          <code>{JSON.stringify(credential, null, 2)}</code>
        </pre>
      </Dialog>
    </>
  );
}

export default CredentialCard;
