import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { Login } from './login';

const flow: KratosFlow = {
  id: 'flow-1',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/login?flow=flow-1`,
    method: 'POST',
    nodes: [],
  },
};

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('initiates a login flow on load', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/login/browser`);
    expect(request.request.withCredentials).toBeTrue();
    request.flush(flow);

    expect(fixture.componentInstance.flow()).toEqual(flow);
  });

  it('navigates to /products once the flow reports success', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/login/browser`).flush(flow);

    const navigateSpy = spyOn(router, 'navigateByUrl');
    fixture.componentInstance.onSubmitted({ identifier: 'jane@example.test', password: 'secret' });

    httpMock.expectOne(flow.ui.action).flush({});

    expect(navigateSpy).toHaveBeenCalledWith('/products');
  });

  it('surfaces an error message when the flow fails outright', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/login/browser`).flush(flow);

    fixture.componentInstance.onSubmitted({ identifier: 'jane@example.test', password: 'wrong' });

    httpMock
      .expectOne(flow.ui.action)
      .flush({ error: 'gone' }, { status: 410, statusText: 'Gone' });

    expect(fixture.componentInstance.error()).toContain('failed');
  });
});
