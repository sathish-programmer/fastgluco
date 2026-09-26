# Arivu Foods x MitoReboot Integration

## Engineering Handoff

**Document version:** 1.2  
**Last updated:** 23 September 2026  
**Integration owner:** Arivu Foods backend  
**API prefix:** `/api/mitoreboot`

This document describes the partner-facing API that MitoReboot uses to read the Arivu Foods catalog, create orders, check order status, and retrieve orders by the MitoReboot reference ID.

This document contains only the API access and data contract provided to MitoReboot.

---

## 1. API Access

| Item | Value |
|---|---|
| Base URL | `https://backend.arivufoods.com/` |
| API prefix | `/api/mitoreboot` |
| API key header | `x-mitoreboot-api-key` |
| MitoReboot API key | `mito_arivu_sk_4c8f7a1d9e2b6f0a3d5c8e1f7b4a9d6c` |

---

## 2. Authentication

Every partner-facing request must include:

```http
x-mitoreboot-api-key: mito_arivu_sk_4c8f7a1d9e2b6f0a3d5c8e1f7b4a9d6c
```

Every request must use the following base URL and header:

```bash
curl -X GET \
  "https://backend.arivufoods.com/api/mitoreboot/products" \
  -H "x-mitoreboot-api-key: mito_arivu_sk_4c8f7a1d9e2b6f0a3d5c8e1f7b4a9d6c"
```

### Authentication behavior

| Condition | HTTP status | Response |
|---|---:|---|
| Header missing | `401` | `{"success":false,"message":"Missing API key. Provide x-mitoreboot-api-key header."}` |
| Key invalid | `403` | `{"success":false,"message":"Invalid API key."}` |

MitoReboot must use this key only from its server-side integration. Do not expose it in browser JavaScript, mobile binaries, logs, or order payloads.

---

## 3. Response conventions

Successful responses use this shape:

```json
{
  "success": true,
  "data": {}
}
```

Some mutation responses also include `message`:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {}
}
```

Error responses use this shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

The API currently uses JSON request and response bodies. Send this header for requests with a body:

```http
Content-Type: application/json
```

---

## 4. Endpoint overview

### Partner endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/mitoreboot/products` | List active MitoReboot products |
| `GET` | `/api/mitoreboot/products/:id` | Get a product by MongoDB ID |
| `POST` | `/api/mitoreboot/orders` | Create an order |
| `GET` | `/api/mitoreboot/orders` | List all orders |
| `GET` | `/api/mitoreboot/orders/:orderId` | Get one order status |
| `POST` | `/api/mitoreboot/orders/status` | Get multiple order statuses |
| `GET` | `/api/mitoreboot/orders/ref/:referenceId` | Get orders by MitoReboot reference ID |

All partner endpoints require `x-mitoreboot-api-key`.

---

## 5. Product API

### 5.1 List active products

```http
GET /api/mitoreboot/products
x-mitoreboot-api-key: <your-api-key>
```

Example:

```bash
curl -X GET \
  "https://backend.arivufoods.com/api/mitoreboot/products" \
  -H "x-mitoreboot-api-key: <your-api-key>"
```

Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "66f1234567890abcdef1234",
      "title": "MitoReboot Daily Formula",
      "category": "supplement",
      "image": "https://cdn.example.com/products/mitoreboot-daily-formula.jpg",
      "description": "Product description.",
      "aboutProduct": "Product description.",
      "howToConsume": "Usage instructions.",
      "keyFeatures": "Key product benefits.",
      "gst": 5,
      "isActive": true,
      "variants": [
        {
          "_id": "76f1234567890abcdef1234",
          "weight": "250g",
          "price": 999,
          "inStock": true
        },
        {
          "_id": "76f1234567890abcdef1235",
          "weight": "500g",
          "price": 1799,
          "inStock": false
        }
      ],
      "createdAt": "2026-09-21T08:30:00.000Z",
      "updatedAt": "2026-09-21T08:30:00.000Z"
    }
  ]
}
```

Only products where `isActive` is `true` are returned by this endpoint. Product order is not guaranteed; sort on the client if needed. `image` is the product image URL and may be an empty string when no image has been configured. `description` is the short product description; `aboutProduct` contains the longer product information.

### Product schema

| Field | Type | Notes |
|---|---|---|
| `_id` | string | Arivu MongoDB product ID; send this back as `cartItems[].productId` |
| `title` | string | Product name |
| `category` | string | Product category |
| `image` | string | Product image URL, or empty string |
| `description` | string | Short product description |
| `aboutProduct` | string | Detailed product information |
| `howToConsume` | string | Usage instructions |
| `keyFeatures` | string | Product highlights |
| `gst` | number | GST percentage |
| `isActive` | boolean | Whether the product is available through the active catalog endpoint |
| `variants` | array | Available pack sizes and prices |
| `variants[].weight` | string | Pack size, for example `1 kg` |
| `variants[].price` | number | Price for that variant |
| `variants[].inStock` | boolean | Whether that variant can be ordered |

### 5.2 Get one product

```http
GET /api/mitoreboot/products/:id
x-mitoreboot-api-key: <your-api-key>
```

Example:

```bash
curl -X GET \
  "https://backend.arivufoods.com/api/mitoreboot/products/66f1234567890abcdef1234" \
  -H "x-mitoreboot-api-key: <your-api-key>"
```

Response: `200 OK` returns one product using the product shape above.

Response when the ID does not exist: `404 Not Found`

```json
{
  "success": false,
  "message": "Product not found"
}
```

The single-product endpoint returns the document by ID. MitoReboot should check `isActive` before allowing a product to be ordered.

---

## 6. Create order

```http
POST /api/mitoreboot/orders
Content-Type: application/json
x-mitoreboot-api-key: <your-api-key>
```

Example:

```bash
curl -X POST \
  "https://backend.arivufoods.com/api/mitoreboot/orders" \
  -H "Content-Type: application/json" \
  -H "x-mitoreboot-api-key: <your-api-key>" \
  --data @mitoreboot-order.json
```

Example request body:

```json
{
  "mitorebootReferenceId": "MITO-REF-2026-0001",
  "orderId": "MITO-A1B2C3D4",
  "paymentId": "pay_example123",
  "cartItems": [
    {
      "productId": "66f1234567890abcdef1234",
      "title": "MitoReboot Daily Formula",
      "description": "Product description.",
      "image": "https://cdn.example.com/products/mitoreboot-daily-formula.jpg",
      "weight": "250g",
      "quantity": 2,
      "productPrice": 999,
      "gst": 5
    }
  ],
  "customerInfo": {
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "street": "45 Anna Nagar Main Road",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": 600040,
    "country": "India"
  },
  "totalAmount": 2097.90,
  "notes": "Please deliver before 5 PM"
}
```

### Required fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `mitorebootReferenceId` | string | Yes | MitoReboot's own reference for the order |
| `orderId` | string | Yes | MitoReboot's unique order ID; must not be reused |
| `cartItems` | array | Yes | Must contain at least one item |
| `cartItems[].productId` | string | Yes | Product MongoDB `_id` |
| `cartItems[].title` | string | Recommended | Product name snapshot at checkout |
| `cartItems[].description` | string | Recommended | Product description snapshot at checkout |
| `cartItems[].image` | string | Recommended | Product image URL snapshot at checkout |
| `cartItems[].quantity` | number | Yes | Quantity for the item |
| `customerInfo` | object | Yes | Delivery customer details |
| `customerInfo.name` | string | Yes | Customer name |
| `customerInfo.phone` | string | Yes | Customer phone |
| `totalAmount` | number | Yes | Amount supplied by MitoReboot |

Optional fields are `paymentId`, `cartItems[].title`, `cartItems[].description`, `cartItems[].image`, `cartItems[].weight`, `cartItems[].productPrice`, `cartItems[].gst`, all optional address fields, and `notes`. Each order item should include the product title, description, image URL, selected weight, unit price, GST, quantity, and product ID so the order record contains complete product details instead of an ID-only line item.

### Important amount behavior

The current API requires `totalAmount` but does **not** calculate, reconcile, or validate it against the product catalog. MitoReboot is responsible for calculating and sending the correct final amount. The API stores the supplied value as received.

### Important order ID behavior

`orderId` is unique in the Arivu database. A repeated `orderId` may produce a database error response. MitoReboot should generate a stable unique order ID and use the status endpoints for retries instead of creating the same order again blindly.

Successful response: `201 Created`

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "MITO-A1B2C3D4",
    "_id": "66f2234567890abcdef1234",
    "totalAmount": 2097.9,
    "orderStatus": "ordered"
  }
}
```

### Validation errors

Missing order fields:

```json
{
  "success": false,
  "message": "mitorebootReferenceId, orderId, cartItems, customerInfo, and totalAmount are required."
}
```

Missing customer name or phone:

```json
{
  "success": false,
  "message": "customerInfo must include name and phone."
}
```

---

## 7. Order status API

### 7.1 Get one order status

```http
GET /api/mitoreboot/orders/:orderId
x-mitoreboot-api-key: <your-api-key>
```

Example:

```bash
curl -X GET \
  "https://backend.arivufoods.com/api/mitoreboot/orders/MITO-A1B2C3D4" \
  -H "x-mitoreboot-api-key: <your-api-key>"
```

Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "orderId": "MITO-A1B2C3D4",
      "mitorebootReferenceId": "MITO-REF-2026-0001",
      "orderStatus": "Shipped",
      "shipmentDetails": {
        "trackerId": "TRACK123",
        "trackerURL": "https://carrier.example/track/TRACK123",
        "logisticsProvider": "Example Logistics"
      }
    }
  ]
}
```

The response is an array even when one order is requested.

### 7.2 Get multiple order statuses

```http
POST /api/mitoreboot/orders/status
Content-Type: application/json
x-mitoreboot-api-key: <your-api-key>
```

Request:

```json
{
  "orderIds": [
    "MITO-A1B2C3D4",
    "MITO-E5F6G7H8"
  ]
}
```

Example:

```bash
curl -X POST \
  "https://backend.arivufoods.com/api/mitoreboot/orders/status" \
  -H "Content-Type: application/json" \
  -H "x-mitoreboot-api-key: <your-api-key>" \
  -d '{"orderIds":["MITO-A1B2C3D4","MITO-E5F6G7H8"]}'
```

The response has the same `data` item shape as the single-order request.

No IDs supplied:

```json
{
  "success": false,
  "message": "At least one orderId is required."
}
```

No matching orders:

```json
{
  "success": false,
  "message": "No orders found"
}
```

---

## 8. Find orders by MitoReboot reference

```http
GET /api/mitoreboot/orders/ref/:referenceId
x-mitoreboot-api-key: <your-api-key>
```

Example:

```bash
curl -X GET \
  "https://backend.arivufoods.com/api/mitoreboot/orders/ref/MITO-REF-2026-0001" \
  -H "x-mitoreboot-api-key: <your-api-key>"
```

Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "66f2234567890abcdef1234",
      "mitorebootReferenceId": "MITO-REF-2026-0001",
      "orderId": "MITO-A1B2C3D4",
      "orderStatus": "ordered",
      "totalAmount": 2097.9,
      "cartItems": [],
      "customerInfo": {},
      "shipmentDetails": {}
    }
  ]
}
```

This endpoint returns full active order documents and sorts them newest first.

---

## 10. Order lifecycle

The current lifecycle values are case-sensitive in stored data:

| Status | Meaning | Customer email |
|---|---|---|
| `ordered` | Order received | None |
| `Packed` | Order packed | None |
| `Shipped` | Handed to logistics provider | Shipment email, when tracker ID exists |
| `Delivered` | Delivery completed | Delivered email |
| `Rejected` | Order cancelled/rejected | Cancelled email |


Shipment details:


---


## 13. Error handling guide

| HTTP status | Meaning | Recommended action |
|---:|---|---|
| `400` | Invalid or incomplete request | Fix the request payload; do not retry unchanged |
| `401` | API key missing | Add `x-mitoreboot-api-key` |
| `403` | API key invalid | Check the secret configured by Arivu |
| `404` | Product/order not found | Confirm the MongoDB product ID or order ID |
| `500` | Server or database error | Retry with backoff and contact Arivu if persistent |

Always inspect the JSON `message` field. Do not treat an HTTP `200` response as a successful business operation unless `success` is also `true`.

---

