import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { Settings } from './settings';

const flow: KratosFlow = {
  id: 'flow-2',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/settings?flow=flow-2`,
    method: 'POST',
    nodes: [],
  },
};

describe('Settings', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'settings', component: Settings }]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => httpMock.verify());

  it('resumes the flow recovery hands off via ?flow=', async () => {
    const settings = await harness.navigateByUrl('/settings?flow=flow-2', Settings);

    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/flows?id=flow-2`).flush(flow);

    expect(settings.flow()).toEqual(flow);
  });

  it('starts a fresh flow when visited without ?flow=', async () => {
    const settings = await harness.navigateByUrl('/settings', Settings);

    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`).flush(flow);

    expect(settings.flow()).toEqual(flow);
  });

  it('surfaces an error when the flow cannot be loaded', async () => {
    const settings = await harness.navigateByUrl('/settings?flow=flow-2', Settings);

    httpMock
      .expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/flows?id=flow-2`)
      .flush(null, { status: 410, statusText: 'Gone' });

    expect(settings.error()).toContain('Could not load');
  });
});
