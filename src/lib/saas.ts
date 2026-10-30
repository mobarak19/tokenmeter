// AI SaaS unit economics (monthly). Money in USD.
export interface SaasInput {
  users: number; // registered users
  activePct: number; // % active on a given day
  msgs: number; // messages per active user per day
  aiPerMsg: number; // $ per message (from the model)
  payingPct: number; // % of users who pay
  price: number; // $ per paying user per month
  feePct: number; // payment / app store %
  feeFixed: number; // $ per transaction
  infraPerUser: number; // $ per registered user per month
  fixed: number; // $ fixed monthly costs
  targetMargin: number; // %
}

export function saas(i: SaasInput) {
  const days = 30;
  const c = i.payingPct / 100, f = i.feePct / 100, m = i.targetMargin / 100;
  const aiPerUser = (i.activePct / 100) * i.msgs * days * i.aiPerMsg; // $ per registered user / month
  const aiTotal = aiPerUser * i.users;
  const paying = i.users * c;
  const revenue = paying * i.price;
  const fees = revenue * f + paying * i.feeFixed;
  const infra = i.infraPerUser * i.users;
  const profit = revenue - fees - aiTotal - infra - i.fixed;
  // Contribution per registered user (before fixed costs)
  const unit = c * (i.price * (1 - f) - i.feeFixed) - aiPerUser - i.infraPerUser;
  const breakEvenUsers = unit > 0 ? Math.ceil(i.fixed / unit) : Infinity;
  // Price per paying user so that (profit before fixed costs) / revenue = target margin
  const denom = c * (1 - f - m);
  const minPrice = denom > 0 ? (aiPerUser + i.infraPerUser + c * i.feeFixed) / denom : Infinity;
  return { aiPerUser, aiPerPaying: paying ? aiTotal / paying : Infinity, aiTotal, paying, revenue, fees, infra, profit, margin: revenue ? profit / revenue : -Infinity, unit, breakEvenUsers, minPrice };
}
