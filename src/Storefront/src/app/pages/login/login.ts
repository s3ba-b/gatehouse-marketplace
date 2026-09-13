import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BrowserLocation } from '../../core/browser-location';
import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

@Component({
  selector: 'app-login',
  imports: [KratosFlowForm, RouterLink],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly browserLocation = inject(BrowserLocation);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // ?flow=<id> is Kratos redirecting here with a flow it already started —
    // the refresh login a too-old settings submit hands off to (issue #27).
    const flowId = this.route.snapshot.queryParamMap.get('flow');
    const flow$ = flowId ? this.kratosFlows.getLoginFlow(flowId) : this.kratosFlows.initLoginFlow();

    flow$.subscribe({
      next: (flow) => this.flow.set(flow),
      error: () => this.error.set('Could not start login. Please try again.'),
    });
  }

  onSubmitted(values: Record<string, unknown>): void {
    const flow = this.flow();
    if (!flow) {
      return;
    }

    this.kratosFlows.submitFlow(flow, values).subscribe({
      next: (result) => {
        if (result.kind === 'success') {
          // A flow started with return_to (e.g. the refresh login's Kratos
          // settings URL, which 303s back to /settings?flow=<id>) goes back
          // there; a plain login lands on the products page as before.
          if (flow.return_to) {
            this.browserLocation.assign(flow.return_to);
          } else {
            void this.router.navigateByUrl('/products');
          }
        } else if (result.kind === 'needs-input') {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Login failed. Please try again.'),
    });
  }
}
