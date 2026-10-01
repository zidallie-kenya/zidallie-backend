import { Injectable } from '@nestjs/common';
import { VehicleEntity } from '../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';

// Kenyan certificates of good conduct don't carry a printed expiry date —
// KYCEntity only stores certificate_of_good_conduct_issue_date — but are
// conventionally treated as valid for 12 months from issue.
// ASSUMPTION: confirm this validity period with whoever owns compliance
// policy; it's the one number in this file not read directly off the KYC
// row itself.
const GOOD_CONDUCT_VALIDITY_MONTHS = 12;

/**
 * Rule 1 — "Only compliant drivers are considered — valid licence, valid
 * good conduct cert. Non-compliant drivers are excluded entirely."
 *
 * Backed by KYCEntity (src/kyc/.../kyc.entity.ts), reached via
 * VehicleEntity.user.kyc — make sure any query loading vehicles for this
 * check includes the 'user.kyc' relation (KYCEntity's own eager:true only
 * covers the KYC->User direction, not the reverse).
 */
@Injectable()
export class DriverComplianceService {
  isCompliant(vehicle: VehicleEntity): boolean {
    const kyc = vehicle.user?.kyc;
    if (!kyc) return false;

    // Admin sign-off on the uploaded documents, not just their presence —
    // a driver shouldn't count as compliant purely because they uploaded
    // something nobody's verified yet.
    if (!kyc.is_verified) return false;

    if (!kyc.driving_license_expiry_date) return false;
    const licenseOk =
      new Date(kyc.driving_license_expiry_date).getTime() > Date.now();
    if (!licenseOk) return false;

    if (!kyc.certificate_of_good_conduct_issue_date) return false;
    const goodConductExpiry = new Date(
      kyc.certificate_of_good_conduct_issue_date,
    );
    goodConductExpiry.setMonth(
      goodConductExpiry.getMonth() + GOOD_CONDUCT_VALIDITY_MONTHS,
    );
    return goodConductExpiry.getTime() > Date.now();
  }

  filterCompliant(vehicles: VehicleEntity[]): VehicleEntity[] {
    return vehicles.filter((v) => this.isCompliant(v));
  }

  /**
   * Human-readable reasons a driver was excluded — useful for an admin
   * view of "why isn't driver X showing up as a candidate", since
   * isCompliant() alone just gives a boolean.
   */
  getComplianceIssues(vehicle: VehicleEntity): string[] {
    const issues: string[] = [];
    const kyc = vehicle.user?.kyc;
    if (!kyc) {
      issues.push('No KYC record on file');
      return issues;
    }
    if (!kyc.is_verified) issues.push('KYC not yet verified by admin');

    if (!kyc.driving_license_expiry_date) {
      issues.push('No driving licence expiry date on file');
    } else if (
      new Date(kyc.driving_license_expiry_date).getTime() <= Date.now()
    ) {
      issues.push(`Driving licence expired ${kyc.driving_license_expiry_date}`);
    }

    if (!kyc.certificate_of_good_conduct_issue_date) {
      issues.push('No certificate of good conduct on file');
    } else {
      const expiry = new Date(kyc.certificate_of_good_conduct_issue_date);
      expiry.setMonth(expiry.getMonth() + GOOD_CONDUCT_VALIDITY_MONTHS);
      if (expiry.getTime() <= Date.now()) {
        issues.push(
          `Certificate of good conduct assumed expired ` +
            `(issued ${kyc.certificate_of_good_conduct_issue_date}, ` +
            `${GOOD_CONDUCT_VALIDITY_MONTHS}mo assumed validity)`,
        );
      }
    }

    return issues;
  }
}
