import { DOCUMENT, Injectable, inject } from '@angular/core';

// Full-page navigation to a URL outside the Router — Kratos's own
// self-service endpoints (e.g. the refresh login a too-old settings submit
// hands off to), which answer with a 303 back to a Storefront ui_url and so
// can't be reached with navigateByUrl. Injectable so specs can stub it rather
// than actually unloading the test page.
@Injectable({ providedIn: 'root' })
export class BrowserLocation {
  private readonly document = inject(DOCUMENT);

  assign(url: string): void {
    this.document.location.assign(url);
  }
}
