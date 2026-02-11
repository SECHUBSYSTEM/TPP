import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "./auth";

/**
 * Returns Prisma where clause for Customer list/read based on current user.
 * Admin: no filter. Location Manager: by locationId. Product Manager: by orders containing their product lines. Customer: own profile only.
 */
export function customerScopeWhere(session: SessionPayload): Prisma.CustomerWhereInput {
  if (session.role === "ADMIN") return {};
  if (session.role === "CUSTOMER" && session.customerId != null) {
    return { id: session.customerId };
  }
  if (session.role === "LOCATION_MANAGER" && session.locationIds.length > 0) {
    return { locationId: { in: session.locationIds } };
  }
  if (session.role === "PRODUCT_MANAGER" && session.productLineIds.length > 0) {
    return {
      orders: {
        some: {
          items: {
            some: {
              product: { productLineId: { in: session.productLineIds } },
            },
          },
        },
      },
    };
  }
  return { id: -1 };
}

/**
 * Returns Prisma where clause for Order list/read.
 */
export function orderScopeWhere(session: SessionPayload): Prisma.OrderWhereInput {
  if (session.role === "ADMIN") return {};
  if (session.role === "CUSTOMER" && session.customerId != null) {
    return { customerId: session.customerId };
  }
  if (session.role === "LOCATION_MANAGER" && session.locationIds.length > 0) {
    return { customer: { locationId: { in: session.locationIds } } };
  }
  if (session.role === "PRODUCT_MANAGER" && session.productLineIds.length > 0) {
    return {
      items: {
        some: {
          product: { productLineId: { in: session.productLineIds } },
        },
      },
    };
  }
  return { id: -1 };
}

export function canAccessCustomer(session: SessionPayload, locationId: number): boolean {
  if (session.role === "ADMIN") return true;
  if (session.role === "CUSTOMER") return false;
  if (session.role === "LOCATION_MANAGER") return session.locationIds.includes(locationId);
  return false;
}

/** Check if session can access a customer (for single customer GET/PATCH). Product Manager: customer must have an order with their product lines. */
export function canAccessCustomerProfile(
  session: SessionPayload,
  customer: {
    id: number;
    locationId: number;
    orders?: { items: { product: { productLineId: number } }[] }[];
  }
): boolean {
  if (session.role === "ADMIN") return true;
  if (session.role === "CUSTOMER") return session.customerId === customer.id;
  if (session.role === "LOCATION_MANAGER") return session.locationIds.includes(customer.locationId);
  if (session.role === "PRODUCT_MANAGER" && customer.orders?.length) {
    return customer.orders.some((o) =>
      o.items.some((i) => session.productLineIds.includes(i.product.productLineId))
    );
  }
  if (session.role === "PRODUCT_MANAGER") return false;
  return false;
}

export function canAccessOrder(
  session: SessionPayload,
  order: { customerId: number; customer: { locationId: number }; items: { product: { productLineId: number } }[] }
): boolean {
  if (session.role === "ADMIN") return true;
  if (session.role === "CUSTOMER" && session.customerId != null) {
    return order.customerId === session.customerId;
  }
  if (session.role === "LOCATION_MANAGER") {
    return session.locationIds.includes(order.customer.locationId);
  }
  if (session.role === "PRODUCT_MANAGER") {
    const orderProductLineIds = order.items.map((i) => i.product.productLineId);
    return orderProductLineIds.some((id) => session.productLineIds.includes(id));
  }
  return false;
}
