/**
 * Local test dataset for ScamLens (spec §24).
 * No performance claims — these are fixtures the test suite actually runs against.
 */

export interface DatasetItem {
  id: string;
  label: string;
  text: string;
}

export const SCAM_DATASET: DatasetItem[] = [
  {
    id: "fake_bank",
    label: "Fake bank block threat",
    text: "HDFC Bank: Your account will be blocked due to KYC expiry. Update KYC immediately at http://bit.ly/kyc-update-2026",
  },
  {
    id: "fake_kyc",
    label: "Fake KYC update",
    text: "Update your KYC immediately to avoid account suspension. Click http://kyc-verify.top to complete verification.",
  },
  {
    id: "otp_scam",
    label: "OTP theft (primary demo)",
    text: "Your bank account will be blocked today. Send your OTP immediately to verify your account.",
  },
  {
    id: "fake_job",
    label: "Fake job offer with fee",
    text: "Congratulations! You are selected for the position of Data Entry Operator. Salary Rs.30,000 per month. A registration fee of Rs.500 is required. WhatsApp 9876543210.",
  },
  {
    id: "lottery",
    label: "Lottery prize scam",
    text: "Congratulations! You have won Rs.25,00,000 in the lottery. Share your bank account number and OTP to claim your prize.",
  },
  {
    id: "investment",
    label: "Investment / doubling money",
    text: "Double your money in 7 days! Guaranteed returns on your investment. Minimum deposit Rs.5000 — limited period offer.",
  },
  {
    id: "upi",
    label: "UPI payment demand",
    text: "Send Rs.5000 to UPI ID 9876543210@okaxis within 24 hours to confirm your KYC.",
  },
  {
    id: "delivery",
    label: "Fake delivery customs fee",
    text: "Your parcel has been held due to an unpaid customs fee of Rs.250. Pay now: http://india-post.refund.top",
  },
  {
    id: "support_impersonation",
    label: "Customer-support impersonation",
    text: "WhatsApp Support: Your account will be suspended. Verify your identity by sharing your password at http://bit.ly/wa-verify",
  },
];

export const LEGIT_DATASET: DatasetItem[] = [
  {
    id: "real_delivery",
    label: "Real delivery notification",
    text: "Your parcel OUT4521 is out for delivery. Delivery executive Ravi will call you before arriving.",
  },
  {
    id: "college",
    label: "College announcement",
    text: "CS Dept: Mid-sem exam timetable has been released. Check the department notice board for details. - HOD",
  },
  {
    id: "promotion",
    label: "Legitimate promotional message",
    text: "Weekend sale! Enjoy 20% off on all headphones this weekend. Use code WEEKEND20 at checkout.",
  },
  {
    id: "bank_credit",
    label: "Normal bank notification",
    text: "HDFC Bank: Your a/c XX1234 is credited with Rs.15,000.00 on 02-10-2026. Avl Bal: Rs.42,310.50",
  },
  {
    id: "job_legit",
    label: "Legitimate job communication",
    text: "Dear Candidate, your interview for Software Intern is scheduled on 5-Oct-2026 at 10:00 AM. Please carry a valid ID proof. - HR Team",
  },
];

export const DEMO_MESSAGE = "Your bank account will be blocked today. Send your OTP immediately to verify your account.";
