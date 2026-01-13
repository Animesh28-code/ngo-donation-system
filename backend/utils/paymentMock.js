// Mock / Sandbox payment gateway logic
function mockPayment(amount) {
  if (amount < 1000) {
    return { status: "SUCCESS" };
  }
  if (amount < 2000) {
    return { status: "FAILED", reason: "Mock payment failed" };
  }
  return { status: "PENDING" };
}

module.exports = { mockPayment };
