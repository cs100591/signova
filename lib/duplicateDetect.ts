import crypto from 'crypto';

// Levenshtein distance function for string similarity
function levenshtein(a: string, b: string): number {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a.length === 0 && b.length === 0) return 1;
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return 1 - (distance / maxLength);
}

export type DuplicateResult = {
  type: 'NONE' | 'EXACT_MATCH' | 'NEW_VERSION' | 'SAME_PARTY';
  existingContractId?: string;
  existingContractName?: string;
  existingDate?: string;
  message?: string;
  contractGroupId?: string;
  fileHash?: string;
};

export async function detectDuplicate(
  fileBuffer: Buffer, 
  fileName: string, 
  userId: string,
  metadata: any,
  supabase: any
): Promise<DuplicateResult> {
  // Layer 1 — File Hash (fastest)
  const hashHex = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  const { data: exactMatch } = await supabase
    .from('contracts')
    .select('id, name, created_at, contract_group_id')
    .eq('file_hash', hashHex)
    .eq('user_id', userId)
    .maybeSingle();

  if (exactMatch) {
    return {
      type: 'EXACT_MATCH',
      existingContractId: exactMatch.id,
      existingContractName: exactMatch.name,
      existingDate: exactMatch.created_at,
      contractGroupId: exactMatch.contract_group_id,
      message: `You already uploaded this contract on ${new Date(exactMatch.created_at).toLocaleDateString()}`,
      fileHash: hashHex
    };
  }

  // Fetch all user's contracts for Layer 2 & 3
  const { data: userContracts } = await supabase
    .from('contracts')
    .select('id, name, party_a, party_b, contract_group_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!userContracts || userContracts.length === 0) {
    return { type: 'NONE', contractGroupId: crypto.randomUUID(), fileHash: hashHex };
  }

  // Layer 2 — Filename similarity (>75%)
  for (const contract of userContracts) {
    if (stringSimilarity(fileName, contract.name) > 0.75) {
      return {
        type: 'NEW_VERSION',
        existingContractId: contract.id,
        existingContractName: contract.name,
        contractGroupId: contract.contract_group_id,
        message: `This looks like a newer version of ${contract.name}`,
        fileHash: hashHex
      };
    }
  }

  // Layer 3 — AI content comparison
  // Extract: party names + date + contract value
  // Here we do a simplified matching on Party A & B matching, plus either same type or same value,
  // or we can fall back to "Same Party".
  
  const pA = metadata?.party_a?.toLowerCase();
  const pB = metadata?.party_b?.toLowerCase();

  if (pA && pB) {
    let samePartyCount = 0;
    let lastPartyMatch = null;

    for (const contract of userContracts) {
      const cA = contract.party_a?.toLowerCase();
      const cB = contract.party_b?.toLowerCase();

      if ((cA === pA && cB === pB) || (cA === pB && cB === pA)) {
        // If they also have the same contract name or type, it might be a new version
        if (contract.name === metadata?.contract_name) {
           return {
             type: 'NEW_VERSION',
             existingContractId: contract.id,
             existingContractName: contract.name,
             contractGroupId: contract.contract_group_id,
             message: `This looks like a newer version of ${contract.name}`,
             fileHash: hashHex
           };
        }
        
        samePartyCount++;
        lastPartyMatch = contract;
      }
    }

    if (samePartyCount > 0 && lastPartyMatch) {
      return {
        type: 'SAME_PARTY',
        existingContractId: lastPartyMatch.id,
        existingContractName: lastPartyMatch.name,
        contractGroupId: lastPartyMatch.contract_group_id,
        message: `You have ${samePartyCount} other contracts with this party.`,
        fileHash: hashHex
      };
    }
  }

  return { type: 'NONE', contractGroupId: crypto.randomUUID(), fileHash: hashHex };
}