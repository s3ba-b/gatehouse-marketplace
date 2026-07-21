import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { KRATOS_PUBLIC_URL } from '../gatehouse-endpoints';
import { toNestedPayload } from './flow-payload';
import { KratosFlow, isKratosFlow } from './kratos-flow.model';

export type FlowSubmitResult = { kind: 'success' } | { kind: 'needs-input'; flow: KratosFlow };

// Requesting with Accept: application/json is what makes Kratos answer a
// browser-type flow with JSON instead of a 303 redirect to its own (absent)
// UI — see https://www.ory.sh/docs/kratos/concepts/ui-user-interface.
const JSON_HEADERS = new HttpHeaders({ Accept: 'application/json' });

@Injectable({ providedIn: 'root' })
export class KratosFlowService {
  private readonly http = inject(HttpClient);

  initRegistrationFlow(): Observable<KratosFlow> {
    return this.initFlow('/self-service/registration/browser');
  }

  initLoginFlow(): Observable<KratosFlow> {
    return this.initFlow('/self-service/login/browser');
  }

  // Generic across registration and login (and any future method Kratos
  // adds): submits to whatever action/method the flow itself specifies, with
  // whatever field values the flow-node form collected.
  submitFlow(
    flow: KratosFlow,
    values: Readonly<Record<string, unknown>>,
  ): Observable<FlowSubmitResult> {
    return this.http
      .request(flow.ui.method, flow.ui.action, {
        body: toNestedPayload(values),
        headers: JSON_HEADERS,
        withCredentials: true,
      })
      .pipe(
        map((): FlowSubmitResult => ({ kind: 'success' })),
        catchError((error: HttpErrorResponse) => {
          // Kratos answers an intermediate step of a multi-step flow (e.g.
          // collecting the profile trait before the credential method) with
          // 400 and the updated flow to render next — not a real failure.
          if (error.status === 400 && isKratosFlow(error.error)) {
            return of<FlowSubmitResult>({ kind: 'needs-input', flow: error.error });
          }

          return throwError(() => error);
        }),
      );
  }

  private initFlow(path: string): Observable<KratosFlow> {
    return this.http.get<KratosFlow>(`${KRATOS_PUBLIC_URL}${path}`, {
      headers: JSON_HEADERS,
      withCredentials: true,
    });
  }
}
