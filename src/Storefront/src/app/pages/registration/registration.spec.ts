import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { Registration } from './registration';

const flow: KratosFlow = {
  id: 'flow-1',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/registration?flow=flow-1`,
    method: 'POST',
    nodes: [],
  },
};

describe('Registration', () => {
  let fixture: ComponentFixture<Registration>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Registration);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('initiates a registration flow on load', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/registration/browser`);
    expect(request.request.withCredentials).toBeTrue();
    request.flush(flow);

    expect(fixture.componentInstance.flow()).toEqual(flow);
  });

  it('navigates to /products once the flow reports success', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/registration/browser`).flush(flow);

    const navigateSpy = spyOn(router, 'navigateByUrl');
    fixture.componentInstance.onSubmitted({
      'traits.email': 'jane@example.test',
      password: 'secret',
    });

    httpMock.expectOne(flow.ui.action).flush({});

    expect(navigateSpy).toHaveBeenCalledWith('/products');
  });

  it('re-renders with the updated flow when Kratos answers a validation step with 400', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/registration/browser`).flush(flow);

    fixture.componentInstance.onSubmitted({ 'traits.email': 'jane@example.test' });

    const nextFlow: KratosFlow = { ...flow, id: 'flow-2' };
    httpMock.expectOne(flow.ui.action).flush(nextFlow, { status: 400, statusText: 'Bad Request' });

    expect(fixture.componentInstance.flow()).toEqual(nextFlow);
  });
});
