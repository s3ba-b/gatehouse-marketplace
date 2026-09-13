import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { Recovery } from './recovery';

const flow: KratosFlow = {
  id: 'flow-1',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/recovery?flow=flow-1`,
    method: 'POST',
    nodes: [],
  },
};

describe('Recovery', () => {
  let fixture: ComponentFixture<Recovery>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recovery],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Recovery);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('initiates a recovery flow on load', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/recovery/browser`);
    expect(request.request.withCredentials).toBeTrue();
    request.flush(flow);

    expect(fixture.componentInstance.flow()).toEqual(flow);
  });

  it('re-renders the flow when Kratos asks for more input (e.g. the code)', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/recovery/browser`).flush(flow);

    fixture.componentInstance.onSubmitted({ email: 'jane@example.test', method: 'code' });

    const nextFlow: KratosFlow = { ...flow, ui: { ...flow.ui, nodes: [] } };
    httpMock.expectOne(flow.ui.action).flush(nextFlow);

    expect(fixture.componentInstance.flow()).toEqual(nextFlow);
  });

  it('navigates to the settings flow Kratos redirects the browser to on success', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/recovery/browser`).flush(flow);

    const navigateSpy = spyOn(router, 'navigateByUrl');
    fixture.componentInstance.onSubmitted({ code: '123456', method: 'code' });

    httpMock.expectOne(flow.ui.action).flush(
      {
        error: { id: 'browser_location_change_required' },
        redirect_browser_to: 'http://storefront.gatehouse.test:4200/settings?flow=flow-2',
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(navigateSpy).toHaveBeenCalledWith('/settings?flow=flow-2');
  });

  it('surfaces an error message when the flow fails outright', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/recovery/browser`).flush(flow);

    fixture.componentInstance.onSubmitted({ email: 'jane@example.test', method: 'code' });

    httpMock
      .expectOne(flow.ui.action)
      .flush({ error: 'gone' }, { status: 410, statusText: 'Gone' });

    expect(fixture.componentInstance.error()).toContain('failed');
  });
});
