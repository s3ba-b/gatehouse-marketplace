import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

@Component({
  selector: 'app-login',
  imports: [KratosFlowForm, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly router = inject(Router);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.kratosFlows.initLoginFlow().subscribe({
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
          void this.router.navigateByUrl('/products');
        } else {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Login failed. Please try again.'),
    });
  }
}
