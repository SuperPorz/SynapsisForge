declare module 'braintree-web-drop-in' {
  export interface Dropin {
    requestPaymentMethod(
      options?: Record<string, unknown>,
    ): Promise<{ nonce: string; details?: Record<string, unknown>; type?: string }>;
    teardown(): Promise<void>;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    clearSelectedPaymentMethod(): void;
    isPaymentMethodRequestable(): boolean;
  }

  export interface DropinOptions {
    authorization: string;
    container: string | HTMLElement;
    locale?: string;
    translations?: Record<string, string>;
    paymentOptionPriority?: string[];
    card?: Record<string, unknown>;
    paypal?: Record<string, unknown>;
    paypalCredit?: Record<string, unknown>;
    venmo?: Record<string, unknown>;
    applePay?: Record<string, unknown>;
    googlePay?: Record<string, unknown>;
    threeDSecure?: boolean | Record<string, unknown>;
    vaultManager?: boolean;
    dataCollector?: Record<string, unknown>;
  }

  export function create(options: DropinOptions): Promise<Dropin>;

  export const VERSION: string;
}
