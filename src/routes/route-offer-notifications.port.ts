/**
 * Rule 5 — "Both the driver-facing push notification (for route offers)
 * and the parent-facing WhatsApp message (for driver match) shall be
 * integrated into this flow."
 *
 * Your notes mention an existing NotificationsService already handling
 * payments/notifications — have IT implement this interface (or wrap it)
 * rather than standing up a second notification pathway. Bind the token
 * below to that implementation in RoutesModule:
 *
 *   { provide: ROUTE_OFFER_NOTIFICATIONS, useExisting: NotificationsService }
 *
 * The RouteOfferLoggingNotifications fallback below just logs — swap it
 * out before going live, but it lets the rest of this feature compile and
 * run (offers/cascades/DB state all work) even before the real
 * integrations are wired.
 */
export const ROUTE_OFFER_NOTIFICATIONS = 'ROUTE_OFFER_NOTIFICATIONS';

export interface RouteOfferNotifications {
  /** Rule 2 — push notification broadcasting a route offer to a driver as part of a batch. */
  sendDriverRouteOffer(params: {
    driverId: number;
    routeId: number;
    kind: 'pickup' | 'dropoff';
    studentCount: number;
    distanceKm: number;
  }): Promise<void>;

  /**
   * Rule 4 — fired once a driver accepts, whether via the cascade or a
   * mid-term replacement (rule 3's "goes back through the same ... flow"
   * re-enters this same commit path, so this fires there too).
   */
  sendParentDriverMatchedWhatsApp(params: {
    bookingChildIds: number[];
    driverId: number;
    routeId: number;
    kind: 'pickup' | 'dropoff';
    driverName: string;
    driverPhone: string | null;
    vehiclePlate: string | null;
    parents: {
      parentId: number;
      pushToken: string | null;
      phoneNumber: string | null;
      parentFirstName: string;
      childNames: string[];
    }[];
  }): Promise<void>;
  /**
   * Not in the original spec, but a natural courtesy given the batch-push
   * model: the other 9 drivers in a batch pushed the same route shouldn't
   * be left silently guessing when someone else takes it. Fired to
   * everyone in a batch whose attempt gets marked 'superseded'. Skip
   * implementing this if you'd rather they just find out when they try to
   * accept and get rejected.
   */
  notifyDriverRouteTaken(params: {
    driverId: number;
    routeId: number;
  }): Promise<void>;

  /**
   * Rule 3 (mid-term removal) and rule 2 step 5 (24hr cascade exhausted
   * with no acceptance) both need an admin-facing alert.
   */
  sendAdminAlert(params: {
    subject: string;
    message: string;
    routeId: number;
  }): Promise<void>;
}
