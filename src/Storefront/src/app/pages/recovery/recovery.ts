import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

@Component({
  selector: 'app-recovery',
  imports: [KratosFlowForm, RouterLink],
  templateUrl: './recovery.html',
})
export class Recovery implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly router = inject(Router);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.kratosFlows.initRecoveryFlow().subscribe({
      next: (flow) => this.flow.set(flow),
      error: () => this.error.set('Could not start account recovery. Please try again.'),
    });
  }

  onSubmitted(values: Record<string, unknown>): void {
    const flow = this.flow();
    if (!flow) {
      return;
    }

    this.kratosFlows.submitFlow(flow, values).subscribe({
      next: (result) => {
        if (result.kind === 'redirect') {
          // A correct recovery code has no flow-body outcome of its own —
          // Kratos hands the browser to the settings flow it created for the
          // password-set step (kratos-flow.service.ts's 'redirect' outcome,
          // verified against a real container). Following it via the Router
          // keeps this an in-app navigation rather than a full page reload.
          const target = new URL(result.url);
          void this.router.navigateByUrl(target.pathname + target.search);
        } else if (result.kind === 'needs-input') {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Recovery failed. Please try again.'),
    });
  }
}
