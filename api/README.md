# GlobalBank Core Banking API — Stub Reference

The `client-portal` Angular app calls these .NET (C# / ASP.NET Core 7) endpoints.
Stubs are used in local development; production routes to the GlobalBank API Gateway.

---

## Base URL
```
https://api.globalbank.internal/api/v2
```
All requests require:
- `Authorization: Bearer <session_token>`
- `X-GB-Client: web-portal-v{version}`
- `X-Request-ID: <uuid>`  (injected by `AuthInterceptor`)

---

## Payments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/payments/submit` | Submit domestic wire, international wire, or ACH |
| GET  | `/payments/limits` | Retrieve per-type daily and per-transaction limits |
| GET  | `/payments/{referenceId}` | Poll payment status |

**POST /payments/submit**
```json
// Request
{
  "recipientAccountNumber": "123456789",
  "routingNumber": "021000021",
  "amount": 1500.00,
  "memo": "Rent - March",
  "paymentType": "domestic"
}

// Response 200
{
  "success": true,
  "referenceId": "GB-PAY-20250310-00847291",
  "error": null
}
```

> ⚠️ Transactions ≥ $10,000 trigger BSA/AML review (31 U.S.C. § 5313).
> The `PAYMENT_SUBMISSION_V3` feature flag gates the new limit-enforcement logic.

---

## Transfers (Zelle®)

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/zelle/contacts` | Recent verified Zelle contacts |
| POST | `/zelle/send` | Initiate a Zelle transfer |

**Zelle limits:** $2,500 per transaction, $20,000 daily.

---

## Profile / KBA

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/profile/kba/questions` | Fetch personalized KBA question set |
| POST | `/profile/kba/verify` | Submit answers; returns `verified` + `attemptsRemaining` |

> KBA is required before: adding a new payee, changing phone/email, unlocking account.
> FFIEC Authentication Guidance compliance enforced server-side.

---

## .NET Project Structure (reference)
```
GlobalBank.Api/
├── Controllers/
│   ├── PaymentsController.cs
│   ├── ZelleController.cs
│   └── ProfileController.cs
├── Services/
│   ├── PaymentSubmissionService.cs    # Orchestrates core banking calls
│   ├── AmlScreeningService.cs         # BSA/AML threshold checks
│   └── KbaVerificationService.cs
├── Models/
│   ├── PaymentRequest.cs
│   ├── PaymentResult.cs
│   └── KbaVerificationRequest.cs
└── GlobalBank.Api.csproj              # net7.0, Swashbuckle, FluentValidation
```
