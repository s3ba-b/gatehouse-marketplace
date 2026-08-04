import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

@Component({
  selector: 'app-verification',
  imports: [KratosFlowForm, RouterLink],
  templateUrl: './verification.html',
})
export class Verification implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // A ?flow=<id> query param means the browser got here via the link in the
    // verification mail (Kratos already processed the code and 303-redirected
    // here — verified against a real container), so that flow's already-final
    // state is fetched and rendered instead of starting a fresh one.
    const flowId = this.route.snapshot.queryParamMap.get('flow');
    const flow$ = flowId
      ? this.kratosFlows.getVerificationFlow(flowId)
      : this.kratosFlows.initVerificationFlow();

    flow$.subscribe({
      next: (flow) => this.flow.set(flow),
      error: () => this.error.set('Could not start verification. Please try again.'),
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
          void this.router.navigateByUrl('/products');
        } else if (result.kind === 'needs-input') {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Verification failed. Please try again.'),
    });
  }
}
