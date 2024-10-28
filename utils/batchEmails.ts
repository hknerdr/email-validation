// utils/batchEmails.ts

/**
 * Splits an array of emails into smaller batches.
 * @param emails - The list of email addresses to batch.
 * @param batchSize - The maximum number of emails per batch.
 * @returns An array of email batches.
 */
export const batchEmails = (emails: string[], batchSize: number): string[][] => {
  const batches: string[][] = [];
  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }
  return batches;
};
