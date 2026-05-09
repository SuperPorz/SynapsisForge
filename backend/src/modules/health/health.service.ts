import { Injectable } from '@nestjs/common';

// Definiamo un'interfaccia per il tipo di risposta
interface HealthResponse {
  status: string;
  timestamp: string; // ISO string è spesso preferibile per le API
}

@Injectable()
export class HealthService {
  healthCheck(): HealthResponse {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}
