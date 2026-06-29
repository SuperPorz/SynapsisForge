import { Component } from '@angular/core';

@Component({
  selector: 'app-api-docs',
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div class="w-full max-w-lg text-center">
        <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-fg-brand/10">
          <svg class="h-10 w-10 text-fg-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-extrabold text-heading">API Documentation</h1>
        <p class="mt-3 text-fg-muted">
          Swagger UI is served by the backend. Open it in a new tab to explore and test all endpoints.
        </p>
        <button
          (click)="openSwagger()"
          class="mt-8 inline-flex items-center gap-2 rounded-lg bg-fg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-fg-brand-strong"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Open Swagger UI
        </button>
        <p class="mt-4 text-xs text-fg-muted">
          {{ swaggerUrl }}
        </p>
      </div>
    </div>
  `,
})
export class ApiDocs {
  swaggerUrl = `${window.location.origin}/api/docs/`;

  openSwagger() {
    window.open(this.swaggerUrl, '_blank');
  }
}
