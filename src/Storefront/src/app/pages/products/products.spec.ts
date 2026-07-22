import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GATEWAY_URL } from '../../core/gatehouse-endpoints';
import { Products } from './products';

describe('Products', () => {
  let fixture: ComponentFixture<Products>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads products through the gateway with credentials', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne(`${GATEWAY_URL}/products`);
    expect(request.request.withCredentials).toBeTrue();
    request.flush([{ id: 1, name: 'Espresso Beans, 1kg', price: 18.5 }]);

    expect(fixture.componentInstance.products()).toEqual([
      { id: 1, name: 'Espresso Beans, 1kg', price: 18.5 },
    ]);
  });

  it('surfaces an error when the request is rejected (not logged in)', () => {
    fixture.detectChanges();

    httpMock
      .expectOne(`${GATEWAY_URL}/products`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(fixture.componentInstance.error()).toContain('log in');
  });
});
