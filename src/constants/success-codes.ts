/** Application success codes returned in mutation/query responses. */
export const SUCCESS_CODES = {
  BLOB_CREATED: 1000,
  BLOB_UPDATED: 1001,
  BLOB_DELETED: 1002,
  BLOB_FETCHED: 1003,
} as const;

export type SuccessCode = (typeof SUCCESS_CODES)[keyof typeof SUCCESS_CODES];
